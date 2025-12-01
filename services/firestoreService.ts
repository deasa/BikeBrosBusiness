import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "./firebase";

// Collection Names
export const COLLECTIONS = {
  BIKES: 'bikes',
  EXPENSES: 'expenses',
  CAPITAL: 'capital',
  BROS: 'bros'
};

// Generic Subscription Hook Logic
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  const colRef = collection(db, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    callback(data);
  });
};

// CRUD Operations

// We use setDoc with a specific ID (guid) so we can control IDs easily on the client side
export const addItem = async (collectionName: string, item: any) => {
  try {
    const itemRef = doc(db, collectionName, item.id);
    await setDoc(itemRef, item);
  } catch (error) {
    console.error(`Error adding item to ${collectionName}:`, error);
    throw error;
  }
};

export const updateItem = async (collectionName: string, id: string, data: any) => {
  try {
    const itemRef = doc(db, collectionName, id);
    await updateDoc(itemRef, data);
  } catch (error) {
    console.error(`Error updating item in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteItem = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting item from ${collectionName}:`, error);
    throw error;
  }
};
