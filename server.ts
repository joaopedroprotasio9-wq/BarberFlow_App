import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import stripe from 'stripe';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import cron from 'node-cron';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();

// --- SISTEMA DE LEMBRETES AUTOMÁTICOS ---
// Este robô roda a cada 15 minutos procurando agendamentos daqui a 1 hora
cron.schedule('*/15 * * * *', async () => {
  console.log('🤖 Verificando lembretes de agendamento...');
  const now = new Date();
  const oneHourFromNowStart = new Date(now.getTime() + 55 * 60 * 1000); // ~55 mins
  const oneHourFromNowEnd = new Date(now.getTime() + 65 * 60 * 1000);   // ~65 mins

  try {
    // Buscamos em todas as barbearias (usando collectionGroup para eficiência)
    const appointmentsSnapshot = await db.collectionGroup('appointments')
      .where('startTime', '>=', oneHourFromNowStart.toISOString())
      .where('startTime', '<=', oneHourFromNowEnd.toISOString())
      .where('status', '==', 'scheduled')
      .get();

    if (appointmentsSnapshot.empty) {
      console.log('✅ Nenhum agendamento para lembrar neste ciclo.');
      return;
    }

    console.log(`📌 Encontramos ${appointmentsSnapshot.size} agendamentos. Verificando telefones...`);

    for (const appDoc of appointmentsSnapshot.docs) {
      const app = appDoc.data();
      const barbershopId = app.barbershopId;
      
      // Buscamos os dados do cliente
      const clientDoc = await db.collection('barbershops').doc(barbershopId).collection('clients').doc(app.clientId).get();
      const client = clientDoc.data();

      if (client && client.phone) {
        const phone = client.phone.replace(/\D/g, '');
        const message = `Olá ${client.name}! Seu horário de ${app.serviceName} está chegando (daqui a 1 hora). Se precisar cancelar, por favor nos avise logo. Até já! 💈`;

        console.log(`📱 [SIMULAÇÃO WHATSAPP] Enviando para: ${phone}`);
        console.log(`💬 Mensagem: "${message}"`);

        /* 
           DICA: Para automatizar de verdade, você usaria um serviço como:
           await axios.post('https://api.seuservico.com/send', { phone, message });
        */
      }
    }
  } catch (error) {
    console.error('❌ Erro no robô de lembretes:', error);
  }
});

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
  return new stripe(key, {
    apiVersion: '2025-01-27.acacia' as any,
  });
};

const app = express();

async function setupServer() {
  // Webhook needs raw body
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      if (webhookSecret && typeof sig === 'string') {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      const stripe = getStripe();
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const barbershopId = session.metadata?.barbershopId || session.client_reference_id;
          
          if (barbershopId) {
            console.log(`Ativando barbearia: ${barbershopId}`);
            await db.collection('barbershops').doc(barbershopId).update({
              subscriptionStatus: 'active',
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              updatedAt: new Date().toISOString()
            });
          }
          break;
        }
        case 'customer.subscription.deleted':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          let targetId = subscription.metadata?.barbershopId;
          
          if (!targetId) {
            const snapshot = await db.collection('barbershops')
              .where('stripeCustomerId', '==', subscription.customer)
              .limit(1)
              .get();
            if (!snapshot.empty) targetId = snapshot.docs[0].id;
          }

          if (targetId) {
            console.log(`Update subscription status for ${targetId}: ${subscription.status}`);
            await db.collection('barbershops').doc(targetId).update({
              subscriptionStatus: subscription.status,
              subscriptionEndDate: new Date((subscription as any).current_period_end * 1000).toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error processing webhook event:', err);
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // Subscription Status Check
  app.post('/api/verify-subscription', async (req, res) => {
    const { barbershopId } = req.body;
    if (!barbershopId) return res.status(400).json({ error: 'barbershopId is required' });

    try {
      const barbershopDoc = await db.collection('barbershops').doc(barbershopId).get();
      if (!barbershopDoc.exists) return res.status(404).json({ error: 'Barbershop not found' });

      const data = barbershopDoc.data() || {};
      const stripeCustomerId = data.stripeCustomerId;
      const stripeSubscriptionId = data.stripeSubscriptionId;

      if (!stripeCustomerId || !stripeSubscriptionId) {
        return res.json({ status: data.subscriptionStatus || 'inactive' });
      }

      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
      
      // Update Firestore with latest status
      await db.collection('barbershops').doc(barbershopId).update({
        subscriptionStatus: subscription.status,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      });

      res.json({ 
        status: subscription.status,
        current_period_end: subscription.current_period_end
      });
    } catch (err: any) {
      console.error('Error verifying subscription:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Stripe Checkout Session
  app.post('/api/create-checkout-session', async (req, res) => {
    const { barbershopId, email } = req.body;
    const currentKey = process.env.STRIPE_SECRET_KEY || '';
    const priceId = process.env.STRIPE_PRICE_ID || 'price_1TL4K9HHbAQf2f29FrNUzAe9';

    try {
      console.log('Iniciando criação de sessão Stripe para:', { barbershopId, email, priceId });
      const isSecretKey = currentKey.startsWith('sk_') || currentKey.startsWith('rk_');
      if (!isSecretKey) {
        throw new Error('CONFIG_ERROR: A chave configurada não é uma chave secreta válida. Use uma chave que comece com "sk_" ou "rk_".');
      }

      const stripe = getStripe();
      
      // Se tivermos um Price ID nas configurações, usamos ele. 
      // Caso contrário, criamos um item dinâmico como fallback.
      const lineItem = priceId ? {
        price: priceId,
        quantity: 1,
      } : {
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'BarberFlow Pro',
            description: 'Assinatura Mensal - Acesso Total',
          },
          unit_amount: 2990, // R$ 29,90
          recurring: {
            interval: 'month' as any,
          },
        },
        quantity: 1,
      };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: 'subscription',
        success_url: `${req.headers.origin || 'https://' + req.headers.host}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'https://' + req.headers.host}/subscription`,
        customer_email: email,
        metadata: {
          barbershopId,
        },
        subscription_data: {
          metadata: {
            barbershopId,
          }
        }
      });

      console.log('Sessão Stripe criada com sucesso:', session.url);
      res.json({ url: session.url });
    } catch (err: any) {
      console.error('ERRO NO STRIPE CHECKOUT:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Stripe Customer Portal
  app.post('/api/create-portal-session', async (req, res) => {
    const { customerId } = req.body;

    try {
      const stripe = getStripe();
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin}/`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// Only start the server if this file is run directly
const PORT = 3000;
setupServer().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

export default app;
