var monolith = new Monolith({
  sizeX: 20,
  sizeY: 20,
  sizeZ: 30,
  blockWidth: 3,
  blockHeight: 1
})

monolith.init()
monolith.generateFloor(8, 8)
