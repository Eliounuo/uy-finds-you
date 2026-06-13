export type Property = {
  id: string;
  title: string;
  city: string;
  district: string;
  address: string;
  price: number; // per night, KZT
  rooms: number;
  area: number;
  guests: number;
  rating: number;
  reviewsCount: number;
  images: string[];
  lat: number;
  lng: number;
  amenities: string[];
  owner: { id: string; name: string; avatar: string };
  description: string;
};

export type ClientRequest = {
  id: string;
  city: string;
  district: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  budgetMax: number;
  notes?: string;
  status: "active" | "closed";
  createdAt: string;
  offersCount: number;
};

export type Offer = {
  id: string;
  requestId: string;
  propertyId: string;
  price: number;
  message: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
};

export type Booking = {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  status: "upcoming" | "active" | "completed" | "cancelled";
};

export type ChatThread = {
  id: string;
  withName: string;
  withAvatar: string;
  propertyTitle: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: { id: string; from: "me" | "them"; text: string; time: string }[];
};

export type Review = {
  id: string;
  propertyId: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
};

const img = (seed: string, w = 800, h = 600) =>
  `https://images.unsplash.com/photo-${seed}?w=${w}&h=${h}&fit=crop&auto=format`;

export const properties: Property[] = [
  {
    id: "p1",
    title: "Светлая студия у Байтерека",
    city: "Астана",
    district: "Есиль",
    address: "ул. Достык, 12",
    price: 18000,
    rooms: 1,
    area: 38,
    guests: 2,
    rating: 4.9,
    reviewsCount: 124,
    images: [
      img("1560448204-e02f11c3d0e2"),
      img("1522708323590-d24dbb6b0267"),
      img("1502672260266-1c1ef2d93688"),
    ],
    lat: 51.1283,
    lng: 71.4304,
    amenities: ["wifi", "kitchen", "washer", "ac", "parking"],
    owner: { id: "o1", name: "Айгерим", avatar: img("1544005313-94ddf0286df2", 200, 200) },
    description:
      "Уютная студия в самом сердце города. Панорамные окна, тёплый пол, быстрая регистрация по QR.",
  },
  {
    id: "p2",
    title: "2-комнатная на Арбате",
    city: "Алматы",
    district: "Медеу",
    address: "ул. Жибек Жолы, 64",
    price: 25000,
    rooms: 2,
    area: 62,
    guests: 4,
    rating: 4.8,
    reviewsCount: 89,
    images: [img("1505691938895-1758d7feb511"), img("1493809842364-78817add7ffb")],
    lat: 43.2566,
    lng: 76.9286,
    amenities: ["wifi", "kitchen", "tv", "balcony"],
    owner: { id: "o2", name: "Данияр", avatar: img("1599566150163-29194dcaad36", 200, 200) },
    description: "Стильная квартира в пешеходной зоне Алматы. Всё рядом: кафе, парки, метро.",
  },
  {
    id: "p3",
    title: "Лофт в Esentai Park",
    city: "Алматы",
    district: "Бостандык",
    address: "пр. Аль-Фараби, 77",
    price: 35000,
    rooms: 2,
    area: 84,
    guests: 4,
    rating: 5.0,
    reviewsCount: 56,
    images: [img("1600585154340-be6161a56a0c"), img("1600566753190-17f0baa2a6c3")],
    lat: 43.2197,
    lng: 76.9067,
    amenities: ["wifi", "kitchen", "gym", "pool", "parking"],
    owner: { id: "o1", name: "Айгерим", avatar: img("1544005313-94ddf0286df2", 200, 200) },
    description: "Лофт с видом на горы. Большое окно во всю стену, дизайнерская мебель.",
  },
  {
    id: "p4",
    title: "Квартира у EXPO",
    city: "Астана",
    district: "Есиль",
    address: "пр. Мангилик Ел, 55",
    price: 16000,
    rooms: 1,
    area: 42,
    guests: 2,
    rating: 4.7,
    reviewsCount: 41,
    images: [img("1502672023488-70e25813eb80"), img("1484154218962-a197022b5858")],
    lat: 51.0922,
    lng: 71.4187,
    amenities: ["wifi", "kitchen", "ac"],
    owner: { id: "o2", name: "Данияр", avatar: img("1599566150163-29194dcaad36", 200, 200) },
    description: "Современная квартира недалеко от выставочного центра EXPO.",
  },
  {
    id: "p5",
    title: "Семейные апартаменты",
    city: "Шымкент",
    district: "Центр",
    address: "ул. Тауке хана, 25",
    price: 14000,
    rooms: 3,
    area: 95,
    guests: 6,
    rating: 4.6,
    reviewsCount: 32,
    images: [img("1493663284031-b7e3aefcae8e"), img("1502005229762-cf1b2da7c5d6")],
    lat: 42.3417,
    lng: 69.5901,
    amenities: ["wifi", "kitchen", "washer", "parking", "balcony"],
    owner: { id: "o3", name: "Серик", avatar: img("1507003211169-0a1dd7228f2d", 200, 200) },
    description: "Просторная 3-комнатная для большой семьи. Тихий двор, детская площадка.",
  },
  {
    id: "p6",
    title: "Минималистичная студия",
    city: "Астана",
    district: "Алматы",
    address: "ул. Кенесары, 40",
    price: 12000,
    rooms: 1,
    area: 32,
    guests: 2,
    rating: 4.5,
    reviewsCount: 28,
    images: [img("1554995207-c18c203602cb"), img("1556228720-195a672e8a03")],
    lat: 51.1605,
    lng: 71.4704,
    amenities: ["wifi", "kitchen"],
    owner: { id: "o3", name: "Серик", avatar: img("1507003211169-0a1dd7228f2d", 200, 200) },
    description: "Минимализм, чистота, всё необходимое для короткой поездки.",
  },
];

export const myRequests: ClientRequest[] = [
  {
    id: "r1",
    city: "Алматы",
    district: "Любой",
    checkIn: "2026-06-20",
    checkOut: "2026-06-23",
    guests: 2,
    budgetMax: 25000,
    notes: "Желательно у парка, с тихими соседями",
    status: "active",
    createdAt: "2026-06-12",
    offersCount: 5,
  },
  {
    id: "r2",
    city: "Астана",
    district: "Есиль",
    checkIn: "2026-07-01",
    checkOut: "2026-07-05",
    guests: 4,
    budgetMax: 30000,
    status: "active",
    createdAt: "2026-06-10",
    offersCount: 2,
  },
];

export const offersForMe: Offer[] = [
  {
    id: "of1",
    requestId: "r1",
    propertyId: "p2",
    price: 22000,
    message: "Готов сделать скидку, ваши даты свободны. Тихий двор, рядом парк.",
    createdAt: "2 ч назад",
    status: "pending",
  },
  {
    id: "of2",
    requestId: "r1",
    propertyId: "p3",
    price: 28000,
    message: "Лофт с видом — идеально для пары. Поздний выезд бесплатно.",
    createdAt: "5 ч назад",
    status: "pending",
  },
];

export const bookings: Booking[] = [
  {
    id: "b1",
    propertyId: "p1",
    checkIn: "2026-06-18",
    checkOut: "2026-06-20",
    guests: 2,
    total: 36000,
    status: "upcoming",
  },
  {
    id: "b2",
    propertyId: "p4",
    checkIn: "2026-05-10",
    checkOut: "2026-05-12",
    guests: 2,
    total: 32000,
    status: "completed",
  },
];

export const chats: ChatThread[] = [
  {
    id: "c1",
    withName: "Айгерим",
    withAvatar: img("1544005313-94ddf0286df2", 200, 200),
    propertyTitle: "Светлая студия у Байтерека",
    lastMessage: "Можно заехать в 14:00?",
    lastTime: "10:24",
    unread: 2,
    messages: [
      { id: "m1", from: "them", text: "Здравствуйте! Спасибо за бронирование 🙂", time: "10:20" },
      { id: "m2", from: "me", text: "Здравствуйте! Когда можно заехать?", time: "10:22" },
      { id: "m3", from: "them", text: "Можно заехать в 14:00?", time: "10:24" },
    ],
  },
  {
    id: "c2",
    withName: "Данияр",
    withAvatar: img("1599566150163-29194dcaad36", 200, 200),
    propertyTitle: "2-комнатная на Арбате",
    lastMessage: "Отправил предложение по вашей заявке",
    lastTime: "Вчера",
    unread: 0,
    messages: [
      { id: "m1", from: "them", text: "Отправил предложение по вашей заявке", time: "Вчера" },
    ],
  },
];

export const reviews: Review[] = [
  {
    id: "rv1",
    propertyId: "p1",
    author: "Алия",
    avatar: img("1438761681033-6461ffad8d80", 200, 200),
    rating: 5,
    text: "Всё идеально! Чисто, тихо, хозяйка очень отзывчивая.",
    date: "май 2026",
  },
  {
    id: "rv2",
    propertyId: "p1",
    author: "Бекзат",
    avatar: img("1507003211169-0a1dd7228f2d", 200, 200),
    rating: 5,
    text: "Локация супер, всё рядом. Рекомендую.",
    date: "апр 2026",
  },
];

// Pro mode mock
export const proProperties = properties.slice(0, 3);

export const incomingRequests: (ClientRequest & { clientName: string; clientAvatar: string })[] = [
  {
    id: "ir1",
    city: "Алматы",
    district: "Медеу",
    checkIn: "2026-06-20",
    checkOut: "2026-06-23",
    guests: 2,
    budgetMax: 25000,
    notes: "Желательно у парка",
    status: "active",
    createdAt: "30 мин назад",
    offersCount: 3,
    clientName: "Алия К.",
    clientAvatar: img("1438761681033-6461ffad8d80", 200, 200),
  },
  {
    id: "ir2",
    city: "Алматы",
    district: "Бостандык",
    checkIn: "2026-06-25",
    checkOut: "2026-06-28",
    guests: 4,
    budgetMax: 35000,
    status: "active",
    createdAt: "2 ч назад",
    offersCount: 1,
    clientName: "Ержан М.",
    clientAvatar: img("1507003211169-0a1dd7228f2d", 200, 200),
  },
  {
    id: "ir3",
    city: "Алматы",
    district: "Любой",
    checkIn: "2026-07-01",
    checkOut: "2026-07-03",
    guests: 2,
    budgetMax: 20000,
    notes: "Командировка, нужен быстрый wifi",
    status: "active",
    createdAt: "вчера",
    offersCount: 7,
    clientName: "Дильназ С.",
    clientAvatar: img("1544005313-94ddf0286df2", 200, 200),
  },
];

export const formatKZT = (n: number) => `${n.toLocaleString("ru-RU")} ₸`;

export const amenityLabels: Record<string, string> = {
  wifi: "Wi-Fi",
  kitchen: "Кухня",
  washer: "Стиральная",
  ac: "Кондиционер",
  parking: "Парковка",
  tv: "ТВ",
  balcony: "Балкон",
  gym: "Спортзал",
  pool: "Бассейн",
};
