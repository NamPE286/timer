import { deleteDoc, addDoc, doc, collection } from "firebase/firestore"
import { db } from "../db"

export default async function handler(req, res) {
  const { id } = req.query
  await deleteDoc(doc(db, 'rooms', id))
  res.status(200).json({test:id})
}
