var monolith = new Monolith({
  blockWidth: 3,
  blockHeight: 1
})

monolith.init()
monolith.generateFloor(12, 12)
monolith.placeObject(monolith.createBlock(0xff44ff), 4, 1, 5)
