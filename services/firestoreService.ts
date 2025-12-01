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
    const data = snapshot.docs.map(doc => {
      // Explicitly spreading data to ensure we return a plain JS object
      // referencing doc.id explicitly
      return {
        ...doc.data(),
        id: doc.id
      };
    });
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
  if (!id) throw new Error("Cannot update item without an ID");
  try {
    const itemRef = doc(db, collectionName, id);
    await updateDoc(itemRef, data);
  } catch (error) {
    console.error(`Error updating item in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteItem = async (collectionName: string, id: string) => {
  if (!id || typeof id !== 'string') {
    console.error(`Attempted to delete from ${collectionName} with invalid ID:`, id);
    throw new Error("Invalid ID for deletion");
  }
  
  try {
    console.log(`[FirestoreService] Deleting doc ${id} from ${collectionName}`);
    await deleteDoc(doc(db, collectionName, id));
    console.log(`[FirestoreService] Successfully deleted ${id}`);
  } catch (error) {
    console.error(`Error deleting item from ${collectionName}:`, error);
    throw error;
  }
};