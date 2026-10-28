import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export let isConnectedToMongo = false;

const DATA_DIR = path.resolve(process.cwd(), 'server/src/data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface InMemoryDB {
  users: any[];
  ingredients: any[];
  pizzas: any[];
  orders: any[];
  emailLogs: any[];
}

const defaultDB: InMemoryDB = {
  users: [],
  ingredients: [],
  pizzas: [],
  orders: [],
  emailLogs: []
};

let localDb: InMemoryDB = defaultDB;

// Load persisted DB if exists
export function loadLocalDB(): InMemoryDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      localDb = JSON.parse(data);
    } else {
      localDb = defaultDB;
      saveLocalDB();
    }
  } catch (err) {
    console.error('Error reading local db file, initializing fresh:', err);
    localDb = defaultDB;
  }
  return localDb;
}

export function saveLocalDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local db file:', err);
  }
}

export function getLocalDB(): InMemoryDB {
  if (!localDb || !localDb.users) {
    loadLocalDB();
  }
  return localDb;
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (uri && !uri.includes('username:password') && !uri.includes('cluster0.example.net')) {
    try {
      console.log('Connecting to MongoDB Atlas / URI...');
      await mongoose.connect(uri);
      isConnectedToMongo = true;
      console.log('Successfully connected to MongoDB.');
      return;
    } catch (error) {
      console.warn('MongoDB connection failed. Falling back to persistent local document store:', error);
      isConnectedToMongo = false;
    }
  } else {
    console.log('No external MONGODB_URI provided in .env; using local JSON-backed document store.');
    isConnectedToMongo = false;
  }

  loadLocalDB();
}
