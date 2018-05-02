var monolith = new Monolith({
  sizeX: 8,
  sizeY: 8,
  sizeZ: 20,
  backgroundColor: 'rgb(53,12,63)',
  blockWidth: 4,
  blockHeight: 2,
  renderDistance: 4,
  gravity: 9.82
})

monolith.init()

for (let x = 0; x < 8; x++) {
  for (let z = 0; z < 8; z++) {
    monolith.placeObject(monolith.createBlock(0x777f79, 700), x, 1, z)
    for (let i = 2; i < Math.round(Math.random() * 3 + 1); i++) {
      monolith.placeObject(monolith.createBlock(0x338749, 700), x, i, z)
    }
  }
}

let player = monolith.createBlock(0x00033, 0.1)
player.mouseDown = () => {
  player.body.position.y += 10
}

monolith.attachMovementControls(player)
monolith.attachCamera(player)
monolith.placeObject(player, 5, 7, 5)

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
