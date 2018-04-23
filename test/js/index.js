var monolith = new Monolith({
  sizeX: 22,
  sizeY: 40,
  sizeZ: 22,
  blockWidth: 3,
  blockHeight: 1,
  gravity: 0.00981
})

monolith.init()
monolith.generateFloor(0, 22, 22)
monolith.generateFloor(1, 10, 10)
monolith.generateFloor(2, 8, 8)
monolith.generateFloor(3, 6, 6)
monolith.placeObject(monolith.createBlock(0xff44ff), 4, 9, 5)
monolith.placeObject(monolith.createBlock(0x44ffff), 4, 7, 5)
monolith.placeObject(monolith.createBlock(0x6ff4ff), 8, 1, 7)
monolith.placeObject(monolith.createBlock(0xffff22), 4, 14, 5)

let player = monolith.createBlock(0x00033)
monolith.attachMovementControls(player)
monolith.attachCamera(player)
monolith.placeObject(player, 7, 32, 8)

window.addEventListener('keydown', (event) => {
  var keyCode = event.keyCode
  switch (keyCode) {
    case 68: // d
      player.move('right')
      break
    case 69: // e
      player.move('forward')
      break
    case 65: // a
      player.move('backward')
      break
    case 81: // q
      player.move('left')
      break
  }
}, false)
