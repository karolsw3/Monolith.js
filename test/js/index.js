var monolith = new Monolith({
  sizeX: 12,
  sizeY: 22,
  sizeZ: 12,
  blockWidth: 3,
  blockHeight: 1,
  renderDistance: 10,
  gravity: 0.00981
})

monolith.init()

for (let x = 0; x < 12; x++) {
  for (let z = 0; z < 12; z++) {
    monolith.placeObject(monolith.createBlock(0xaaffaa), x, 0, z)
    if (Math.round(Math.random() * 6) === 1) {
      monolith.placeObject(monolith.createBlock(0xffaaaa), x, 15, z)
    }
    if (Math.round(Math.random() * 6) === 1) {
      monolith.placeObject(monolith.createBlock(0x22ffaa), x, 17, z)
    }
  }
}

let player = monolith.createBlock(0x00033)
monolith.attachMovementControls(player)
monolith.attachCamera(player)
monolith.placeObject(player, 7, 19, 8)

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
