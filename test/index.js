var monolith = new Monolith({
  blockWidth: 3,
  blockHeight: 1,
  gravity: 0.008
})

monolith.init()
monolith.generateFloor(12, 12)
monolith.placeObject(monolith.createBlock(0xff44ff), 4, 9, 5)
monolith.placeObject(monolith.createBlock(0x44ffff), 4, 5, 5)
monolith.placeObject(monolith.createBlock(0x447ff4), 7, 32, 8)
