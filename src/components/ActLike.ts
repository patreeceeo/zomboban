// TODO: do away with this enum?
export enum ActLike {
  NONE = 0,
  PLAYER = 1,
  BOX = 1 << 1,
  WALL = 1 << 2,
  BRO = 1 << 3,
  AIRPLANE = 1 << 4,
  GAME_OBJECT = ActLike.PLAYER |
    ActLike.BOX |
    ActLike.WALL |
    ActLike.BRO |
    ActLike.AIRPLANE,
  PUSHER = ActLike.PLAYER | ActLike.BRO,
  ENEMY = ActLike.BRO,
  CURSOR = 1 << 40,
}
