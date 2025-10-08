import { RoomConfig } from "../types/availability";

// Room configuration data - maps room numbers to detailed room information
export const roomsConfig: Record<number, RoomConfig> = {
  1: {
    roomNumber: 1,
    roomName: "Кімната 1",
    name: "№1 Cтандарт",
    description: "2 гостя · 1 спальня · 1 двухспальне ліжко · 1 санвузол · вихід на терассу · вид на гори",
    maxPersons: 2,
    price: 2300,
    images: [
      "/assets/images/rooms/room-1/room-1.jpeg",
      "/assets/images/rooms/room-1/bed-1.jpeg",
      "/assets/images/rooms/room-1/view-1.jpeg",
      "/assets/images/rooms/room-1/wc-1.jpeg",
      "/assets/images/rooms/room-1/window-1.jpeg",
    ],
  },
  2: {
    roomNumber: 2,
    roomName: "Кімната 2",
    name: "№2 Люкс",
    description: "2-3 гостя · 1 спальня · 1 двоспальне ліжко · 1 санвузол · вихід на терассу · вид на гори",
    maxPersons: 3,
    price: 2500,
    images: [
      "/assets/images/rooms/room-2/bed-2.jpg",
      "/assets/images/rooms/room-2/overview-2.jpg",
      "/assets/images/rooms/room-2/room-2.jpg",
      "/assets/images/rooms/room-2/view-2.jpg",
      "/assets/images/rooms/room-2/wc-2.jpg",
    ],
  },
  3: {
    roomNumber: 3,
    roomName: "Кімната 3",
    name: "№3 Люкс",
    description: "2 гостя · 1 спальня · 1 двоспальне ліжко · 1 санвузол · вихід на терассу · вид на гори",
    maxPersons: 2,
    price: 2500,
    images: [
      "/assets/images/rooms/room-3/bed-3.jpg",
      "/assets/images/rooms/room-3/overview-3.jpg",
      "/assets/images/rooms/room-3/room-3.jpg",
      "/assets/images/rooms/room-3/view-3.jpeg",
      "/assets/images/rooms/room-3/wc-3.jpg",
    ],
  },
  4: {
    roomNumber: 4,
    roomName: "Кімната 4",
    name: "№4 Делюкс",
    description: "2 гостя · 1 спальня · 1 двоспальне ліжко · 1 санвузол · вихід на терассу · вид на гори",
    maxPersons: 2,
    price: 2700,
    images: [
      "/assets/images/rooms/room-4/bed-4.jpg",
      "/assets/images/rooms/room-4/overview-4.jpeg",
      "/assets/images/rooms/room-4/room-4.jpg",
      "/assets/images/rooms/room-4/view-4.jpeg",
      "/assets/images/rooms/room-4/wc-4.jpeg",
    ],
  },
  5: {
    roomNumber: 5,
    roomName: "Кімната 5",
    name: "№5 Делюкс",
    description: "2 гостя · 1 спальня · 1 двоспальне ліжко · 1 санвузол · вихід на терассу · вид на гори",
    maxPersons: 2,
    price: 2700,
    images: [
      "/assets/images/rooms/room-5/overview-5.jpeg",
      "/assets/images/rooms/room-5/bed-5.jpeg",
      "/assets/images/rooms/room-5/room-5.jpg",
      "/assets/images/rooms/room-5/view-5.jpg",
      "/assets/images/rooms/room-5/wc-5.jpg",
    ],
  },
  6: {
    roomNumber: 6,
    roomName: "Кімната 6",
    name: "№6 Делюкс",
    description: "2-3 гостя · 1 спальня · 1 двоспальне ліжко · 1 санвузол · вихід на терассу · вид на гори",
    maxPersons: 3,
    price: 2700,
    images: [
      "/assets/images/rooms/room-6/bed-6.jpg",
      "/assets/images/rooms/room-6/overview-6.jpeg",
      "/assets/images/rooms/room-6/room-6.jpg",
      "/assets/images/rooms/room-6/view-6.jpg",
      "/assets/images/rooms/room-6/wc-6.jpg",
    ],
  },
  7: {
    roomNumber: 7,
    roomName: "Mirador",
    name: "Коттедж Mirador",
    description:
      "2-4 гостя · 1 двоспальне ліжко · 1 розкладна канапа · кухня · 1 санвузол · вихід на терассу · вид на гори",
    maxPersons: 4,
    price: 4500,
    images: [
      "/assets/images/rooms/mirador/view-mirador.jpg",
      "/assets/images/rooms/mirador/room-mirador.jpeg",
      "/assets/images/rooms/mirador/kitchen-mirador.jpeg",
      "/assets/images/rooms/mirador/wc-mirador.jpeg",
      "/assets/images/rooms/mirador/outside-mirador.jpg",
    ],
  },
};

// Helper function to get room info by room number
export const getRoomConfig = (roomNumber: number): RoomConfig | null => {
  return roomsConfig[roomNumber] || null;
};

// Helper function to get all available room configs for a list of room numbers
export const getRoomConfigList = (roomNumbers: number[]): RoomConfig[] => {
  return roomNumbers.map(roomNumber => getRoomConfig(roomNumber)).filter((room): room is RoomConfig => room !== null);
};

// Helper function to convert RoomConfig to basic RoomInfo for compatibility
export const getRoomInfo = (roomNumber: number): { roomNumber: number; roomName: string } | null => {
  const config = getRoomConfig(roomNumber);
  if (!config) return null;
  return {
    roomNumber: config.roomNumber,
    roomName: config.roomName,
  };
};
