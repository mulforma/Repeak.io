interface PlayerData {
  name: String;
  id: String;
}

interface RoomData {
  roomId: String;
  roomOwner: PlayerData;
  roomPublic: Boolean;
  roomState: "waiting" | "playing" | "finished";
  roomMode: "speaking" | "gesturing" | "writing" | "idle";
  roomPlayers: Array<PlayerData>
}