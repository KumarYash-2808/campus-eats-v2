const admin = require('firebase-admin')
const serviceAccount = require('./campus-eats-c49b7-firebase-adminsdk-fbsvc-c6318f8cf9.json')
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

async function seed(){
    const cafRef = db.collection('cafeterias').doc('cafeteria-001')
    await cafRef.set({ name: 'Campus 15', location: 'Block A' })
    const items = [
    { name: 'Veg Sandwich', Price: 40, Stock: 20, cafeteriaId: 'cafeteria-001' },
    { name: 'Coffee', Price: 20, Stock: 50, cafeteriaId: 'cafeteria-001' }
    ]
    for(const it of items){
    await db.collection('Items').add(it)
    }
    console.log('seed done')
}
seed().catch(console.error)