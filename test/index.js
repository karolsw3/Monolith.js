var monolith = new Monolith({
  sizeX: 20,
  sizeY: 20,
  sizeZ: 30,
  blockWidth: 5,
  blockHeight: 2
})

monolith.init()
monolith.placeBlock(0, 0, 0)
monolith.placeBlock(1, 0, 0)
monolith.placeBlock(0, 1, 0)
