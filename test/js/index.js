var monolith = new Monolith({
  sizeX: 40,
  sizeY: 110,
  sizeZ: 40,
  backgroundColor: 'rgb(53,12,63)',
  blockWidth: 3,
  blockHeight: 1,
  renderDistance: 2,
  gravity: 0.00981
})

monolith.init()

for (let x = 0; x < 35; x++) {
  for (let z = 0; z < 35; z++) {
    monolith.placeObject(monolith.createBlock(0xaaaaaa), x, 0, z)
    if (Math.round(Math.random() * 8) === 1) {
      monolith.placeObject(monolith.createBlock(0x555555), x, 5, z)
    }
    if (Math.round(Math.random() * 12) === 1) {
      monolith.placeObject(monolith.createBlock(0xaa55f4), x, 7, z)
      monolith.placeObject(monolith.createBlock(0xbcdef3), x, 9, z)
      monolith.placeObject(monolith.createBlock(0x44adde), x, 11, z)
    }
  }
}

let player = monolith.createBlock(0x00033)
player.mouseDown = () => {
  player.position.y += 10
}
monolith.attachMovementControls(player)
monolith.attachCamera(player)
monolith.placeObject(player, 10, 6, 10)

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
