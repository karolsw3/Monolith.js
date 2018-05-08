var monolith = new Monolith({
  backgroundColor: 'rgb(53,12,63)',
  blockWidth: 3,
  blockHeight: 1,
  renderDistance: 4,
  gravity: true,
  grid: {
    width: 3,
    height: 1,
    depth: 3,
    visible: false
  }
})

monolith.init()

for (let x = 0; x < 8; x++) {
  for (let z = 0; z < 8; z++) {
    monolith.placeObject(monolith.createBlock(0x443355, 0), x, 0, z)
    for (let i = 2; i < Math.round(Math.random() * 4 + 2); i++) {
      if (Math.round(Math.random() * 3) === 1) {
        monolith.placeObject(monolith.createBlock(0xff8749, 700), x, i, z)
      }
    }
  }
}

let player = monolith.createBlock(0x44ff33, 0.1)
player.mouseDown = () => {
  player.body.position.y += 10
}

monolith.attachCamera(player)
monolith.placeObject(player, 5, 22, 5)

monolith.loadObject('https://api.myjson.com/bins/1ewmje', -12, 14, -12)
monolith.letAllFloatingObjectsFall()
window.addEventListener('keydown', (event) => {
  var keyCode = event.keyCode
  switch (keyCode) {
    case 68: // d
      monolith.moveObject(player, 'right')
      monolith.letAllFloatingObjectsFall()
      break
    case 69: // e
      monolith.moveObject(player, 'forward')
      monolith.letAllFloatingObjectsFall()
      break
    case 65: // a
      monolith.moveObject(player, 'backward')
      monolith.letAllFloatingObjectsFall()
      break
    case 81: // q
      monolith.moveObject(player, 'left')
      monolith.letAllFloatingObjectsFall()
      break
  }
}, false)
