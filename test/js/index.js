var monolith = new Monolith({
  blockWidth: 3,
  blockHeight: 1,
  gravity: 0.004
})

monolith.init()
monolith.generateFloor(12, 12)
monolith.placeObject(monolith.createBlock(0xff44ff), 4, 9, 5)
monolith.placeObject(monolith.createBlock(0x44ffff), 4, 7, 5)
monolith.placeObject(monolith.createBlock(0xffff22), 4, 14, 5)

let player = monolith.createBlock(0x00033)
monolith.attachMovementControls(player)
monolith.placeObject(player, 7, 32, 8)

window.addEventListener('keydown', (event) => {
  var keyCode = event.keyCode
  switch (keyCode) {
    case 68: // d
      player.move('right')
      break
    case 69: // e
      player.move('up')
      break
    case 65: // a
      player.move('down')
      break
    case 81: // q
      player.move('left')
      break
  }
}, false)
