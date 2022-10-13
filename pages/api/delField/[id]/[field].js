import { deleteDoc, addDoc, doc, collection, updateDoc, deleteField } from "firebase/firestore"
import { db } from "../../db"

export default async function handler(req, res) {
  const { id, field } = req.query
  const a = {}
  a[field] = deleteField()
  await updateDoc(doc(db, 'rooms', id), a)
  res.status(200).json({test:id})
}
