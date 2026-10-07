// services/firestore-converters.ts
// Conversione tipizzata tra i documenti Firestore e i tipi in types/index.ts.
// In lettura i Timestamp diventano Date; in scrittura le Date diventano Timestamp.
// La forma dei documenti salvati resta invariata rispetto ai dati già esistenti.
import {
  FillerBox,
  Itinerary,
  ItineraryBox,
  ItineraryDay,
  ItineraryItem,
  Post,
  SavedBox,
  User,
} from '@/types';
import {
  DocumentData,
  FirestoreDataConverter,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
} from 'firebase/firestore';

// Timestamp serializzato (es. passato come JSON) senza i metodi della classe
export type SerializedTimestamp = { seconds: number; nanoseconds: number };

export type DateLike = Timestamp | Date | SerializedTimestamp;

function isDateLike(value: unknown): value is DateLike {
  if (value instanceof Date || value instanceof Timestamp) return true;
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SerializedTimestamp).seconds === 'number' &&
    typeof (value as SerializedTimestamp).nanoseconds === 'number'
  );
}

export function toDate(value: DateLike | null | undefined): Date | undefined {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (isDateLike(value)) return new Timestamp(value.seconds, value.nanoseconds).toDate();
  return undefined;
}

// Per i campi Date obbligatori: un documento senza data valida riceve l'epoch
// invece di far fallire la lettura
function requireDate(value: DateLike | null | undefined): Date {
  return toDate(value) ?? new Date(0);
}

// Converte in Timestamp solo i valori data; gli altri (es. FieldValue) restano invariati
function toTimestamp(value: unknown): unknown {
  return isDateLike(value) ? Timestamp.fromDate(toDate(value)!) : value;
}

// Copia dei dati del modello con i campi data indicati convertiti in Timestamp
// (solo se presenti, per non aggiungere chiavi nelle scritture parziali)
function withTimestamps(model: object, dateFields: string[], keepId: boolean): DocumentData {
  const data: DocumentData = { ...model };
  if (!keepId) delete data.id;
  for (const field of dateFields) {
    if (field in data) data[field] = toTimestamp(data[field]);
  }
  return data;
}

// ─────────────────────────────────────────
// BOX (embedded in post, itinerari e box salvati)
// ─────────────────────────────────────────

function boxFromFirestore(data: DocumentData): ItineraryBox {
  return { ...data, createdAt: requireDate(data.createdAt) } as ItineraryBox;
}

function fillerFromFirestore(data: DocumentData): FillerBox {
  return { ...data, createdAt: requireDate(data.createdAt) } as FillerBox;
}

// I box embedded conservano il proprio campo id
function boxToFirestore(box: unknown): unknown {
  if (typeof box !== 'object' || box === null) return box;
  return withTimestamps(box, ['createdAt'], true);
}

// ─────────────────────────────────────────
// USER
// ─────────────────────────────────────────

export const userConverter: FirestoreDataConverter<User> = {
  // I documenti utente esistenti contengono anche il campo id: lo manteniamo
  toFirestore(user: PartialWithFieldValue<User>): DocumentData {
    return withTimestamps(user, ['createdAt'], true);
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): User {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      createdAt: requireDate(data.createdAt),
    } as User;
  },
};

// ─────────────────────────────────────────
// POST
// ─────────────────────────────────────────

export const postConverter: FirestoreDataConverter<Post> = {
  // L'id coincide con doc.id e non viene salvato nel documento
  toFirestore(post: PartialWithFieldValue<Post>): DocumentData {
    const data = withTimestamps(post, ['createdAt', 'updatedAt'], false);
    if (Array.isArray(data.boxes)) {
      data.boxes = data.boxes.map(boxToFirestore);
    }
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Post {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      boxes: Array.isArray(data.boxes) ? data.boxes.map(boxFromFirestore) : [],
      createdAt: requireDate(data.createdAt),
      updatedAt: requireDate(data.updatedAt),
    } as Post;
  },
};

// ─────────────────────────────────────────
// ITINERARY
// ─────────────────────────────────────────

function itemFromFirestore(item: DocumentData): ItineraryItem {
  return {
    ...item,
    ...(item.boxData && { boxData: boxFromFirestore(item.boxData) }),
    ...(item.fillerData && { fillerData: fillerFromFirestore(item.fillerData) }),
  } as ItineraryItem;
}

function itemToFirestore(item: unknown): unknown {
  if (typeof item !== 'object' || item === null) return item;
  const data: DocumentData = { ...item };
  if (data.boxData) data.boxData = boxToFirestore(data.boxData);
  if (data.fillerData) data.fillerData = boxToFirestore(data.fillerData);
  return data;
}

function dayFromFirestore(day: DocumentData): ItineraryDay {
  return {
    ...day,
    items: Array.isArray(day.items) ? day.items.map(itemFromFirestore) : [],
  } as ItineraryDay;
}

function dayToFirestore(day: unknown): unknown {
  if (typeof day !== 'object' || day === null) return day;
  const data: DocumentData = { ...day };
  if (Array.isArray(data.items)) data.items = data.items.map(itemToFirestore);
  return data;
}

export const itineraryConverter: FirestoreDataConverter<Itinerary> = {
  // L'id coincide con doc.id e non viene salvato nel documento
  toFirestore(itinerary: PartialWithFieldValue<Itinerary>): DocumentData {
    const data = withTimestamps(itinerary, ['createdAt', 'updatedAt'], false);
    if (Array.isArray(data.days)) {
      data.days = data.days.map(dayToFirestore);
    }
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Itinerary {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      days: Array.isArray(data.days) ? data.days.map(dayFromFirestore) : [],
      createdAt: requireDate(data.createdAt),
      updatedAt: requireDate(data.updatedAt),
    } as Itinerary;
  },
};

// ─────────────────────────────────────────
// SAVED BOX
// ─────────────────────────────────────────

export const savedBoxConverter: FirestoreDataConverter<SavedBox> = {
  // I box salvati esistenti contengono anche il campo id: lo manteniamo
  toFirestore(savedBox: PartialWithFieldValue<SavedBox>): DocumentData {
    const data = withTimestamps(savedBox, ['savedAt'], true);
    if ('box' in data) data.box = boxToFirestore(data.box);
    return data;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): SavedBox {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
      box: boxFromFirestore(data.box ?? {}),
      savedAt: requireDate(data.savedAt),
    } as SavedBox;
  },
};
