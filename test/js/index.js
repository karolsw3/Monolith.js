var monolith = new Monolith({
  backgroundColor: 'rgb(53,12,63)',
  blockWidth: 3,
  blockHeight: 1,
  renderDistance: 4,
  gravity: 19.82
})

monolith.init()

for (let x = 0; x < 8; x++) {
  for (let z = 0; z < 8; z++) {
    monolith.placeObject(monolith.createBlock(0x443355, 0), x, 1, z)
    monolith.placeObject(monolith.createBlock(0xff5522, 700), x, 2, z)
    for (let i = 5; i < Math.round(Math.random() * 3 + 5); i++) {
      if (Math.round(Math.random() * 2) === 1) {
        monolith.placeObject(monolith.createBlock(0xff8749, 700), x, i, z)
      } else {
        monolith.placeObject(monolith.createBlock(0x559af4, 700), x, i, z)
      }
    }
  }
}

let player = monolith.createBlock(0x44ff33, 0.1)
player.mouseDown = () => {
  player.body.position.y += 10
}

player.attachMovementControls()
monolith.attachCamera(player)
monolith.placeObject(player, 5, 9, 5)

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
