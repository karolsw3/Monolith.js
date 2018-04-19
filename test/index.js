var monolith = new Monolith({
  blockWidth: 3,
  blockHeight: 1,
  gravity: 0.002
})

monolith.init()
monolith.generateFloor(12, 12)
monolith.placeObject(monolith.createBlock(0xff44ff), 4, 9, 5)
monolith.placeObject(monolith.createBlock(0x44ffff), 4, 7, 5)
monolith.placeObject(monolith.createBlock(0xffff22), 4, 14, 5)

let player = monolith.createBlock(0x00033)
monolith.attachQEADControls(player)
monolith.placeObject(player, 7, 32, 8)
