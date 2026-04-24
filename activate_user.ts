import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = !admin.apps.length 
  ? admin.initializeApp({ projectId: firebaseConfig.projectId })
  : admin.app();

const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function activateUser(email) {
  console.log(`Buscando barbearia para o email: ${email}...`);
  const snapshot = await db.collection('barbershops').where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log('Nenhuma barbearia encontrada com este email.');
    return;
  }

  const doc = snapshot.docs[0];
  await doc.ref.update({
    subscriptionStatus: 'active',
    updatedAt: new Date().toISOString()
  });
  
  console.log(`SUCESSO: Barbearia ${doc.id} (${email}) ativada com sucesso!`);
}

activateUser('joaopedroprotasio9@gmail.com');
