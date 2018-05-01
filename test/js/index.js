var monolith = new Monolith({
  sizeX: 10,
  sizeY: 10,
  sizeZ: 20,
  backgroundColor: 'rgb(53,12,63)',
  blockWidth: 3,
  blockHeight: 1,
  renderDistance: 4,
  gravity: 9.82
})

monolith.init()

for (let x = 0; x < 10; x++) {
  for (let z = 0; z < 10; z++) {
    monolith.placeObject(monolith.createBlock(0xFF4136, 0), x, 1, z)
    monolith.placeObject(monolith.createBlock(0xFF4f3f, 0), x, 2, z)
    if (Math.round(Math.random() * 8) === 1) {
      monolith.placeObject(monolith.createBlock(0x555555, 0), x, 2, z)
    }
    if (Math.round(Math.random() * 15) === 1) {
      for (let i = 4; i < 20; i++) {
        monolith.placeObject(monolith.createBlock(0xaa55f4, 0), x, i, z)
      }
    }
  }
}

let player = monolith.createBlock(0x00033, 1)
player.mouseDown = () => {
  player.position.y += 3
}

monolith.attachMovementControls(player)
monolith.attachCamera(player)
monolith.placeObject(player, 5, 6, 5)

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
