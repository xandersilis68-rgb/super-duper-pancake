const roster = [
  {name: 'Alice', number: 1},
  {name: 'Bob', number: 2},
  {name: 'Charlie', number: 3},
  {name: 'Diana', number: 4},
  {name: 'Evan', number: 5},
  {name: 'Fiona', number: 6},
  {name: 'Libby', number: 7, libero: true} // libero
];

const court = document.getElementById('court');
const rosterList = document.getElementById('roster');
const subLog = document.getElementById('subLog');
const rotationOverlay = document.getElementById('rotationOverlay');

let draggedPlayer = null;

const rotationCoords = [
  {x: 100, y: 300}, // Pos 1
  {x: 250, y: 300}, // Pos 6
  {x: 400, y: 300}, // Pos 5
  {x: 100, y: 100}, // Pos 2
  {x: 250, y: 100}, // Pos 3
  {x: 400, y: 100}  // Pos 4
];

function drawRotation() {
  rotationOverlay.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const div = document.createElement('div');
    div.className = 'rotationPos';
    div.dataset.pos = i;
    div.textContent = (i+1);
    rotationOverlay.appendChild(div);
  }
}
drawRotation();

// Initialize roster sidebar
roster.forEach(player => {
  const li = document.createElement('li');
  li.textContent = `#${player.number} ${player.name}${player.libero ? ' (Libero)' : ''}`;
  li.draggable = true;
  li.addEventListener('dragstart', e => draggedPlayer = player);
  rosterList.appendChild(li);
});

// Court drag & drop
court.addEventListener('dragover', e => e.preventDefault());
court.addEventListener('drop', e => {
  e.preventDefault();
  if (!draggedPlayer) return;
  const posIndex = findFreeRotationPosition(draggedPlayer);
  addPlayerToCourt(draggedPlayer, rotationCoords[posIndex].x, rotationCoords[posIndex].y);
  updateRotationHighlights();
  draggedPlayer = null;
});

function findFreeRotationPosition(player) {
  if(player.libero) return Math.floor(Math.random()*6);
  for (let i = 0; i < 6; i++) {
    if(!document.querySelector(`.player[data-rotation='${i}']`)) return i;
  }
  return 0;
}

function addPlayerToCourt(player, left, top) {
  if(document.getElementById('player-' + player.number)) return;

  const div = document.createElement('div');
  div.className = 'player' + (player.libero ? ' libero' : '');
  div.id = 'player-' + player.number;
  div.textContent = player.number;
  div.style.left = left + 'px';
  div.style.top = top + 'px';
  div.draggable = true;

  if(!player.libero){
    const posIndex = rotationCoords.findIndex(c => c.x === left && c.y === top);
    div.dataset.rotation = posIndex;
  }

  // Drag inside court
  div.addEventListener('dragstart', e => {
    draggedPlayer = player;
    setTimeout(() => div.style.display='none', 0);
  });
  div.addEventListener('dragend', e => {
    div.style.display='block';
    draggedPlayer = null;
    snapToRotation(div, player);
  });

  // Click to sub or rename
  div.addEventListener('click', () => openSubMenu(player));

  court.appendChild(div);
  updateRotationHighlights();
}

function snapToRotation(div, player){
  if(player.libero) return;
  const pos = parseInt(div.dataset.rotation);
  div.style.left = rotationCoords[pos].x + 'px';
  div.style.top = rotationCoords[pos].y + 'px';
}

function updateRotationHighlights(){
  document.querySelectorAll('.rotationPos').forEach(div=>{
    div.classList.remove('occupied');
  });
  document.querySelectorAll('.player').forEach(p=>{
    if(p.dataset.rotation) {
      const posDiv = document.querySelector(`.rotationPos[data-pos='${p.dataset.rotation}']`);
      if(posDiv) posDiv.classList.add('occupied');
    }
  });
}

// Substitutions + Rename
function openSubMenu(player) {
  const action = prompt(`Player #${player.number} ${player.name}:\nType "sub" to substitute, "name" to change name.`);
  if(!action) return;

  if(action.toLowerCase() === 'name'){
    const newName = prompt(`Enter new name for #${player.number}:`, player.name);
    if(newName){
      player.name = newName;
      document.getElementById('player-' + player.number).title = newName;
      alert(`Name updated: #${player.number} ${newName}`);
    }
  } else if(action.toLowerCase() === 'sub'){
    if(player.libero){
      const backRowPlayers = roster.filter(p => !p.libero);
      const subName = prompt(`Libero #${player.number} ${player.name} substitutes a back-row player.\nAvailable: ${backRowPlayers.map(p=>'#'+p.number).join(', ')}`);
      if(subName){
        const subNumber = parseInt(subName);
        const subPlayer = backRowPlayers.find(p => p.number === subNumber);
        if(subPlayer){
          document.getElementById('player-' + subPlayer.number)?.remove();
          addPlayerToCourt(player, rotationCoords[Math.floor(Math.random()*6)].x, rotationCoords[Math.floor(Math.random()*6)].y);
          const li = document.createElement('li');
          li.textContent = `Libero #${player.number} in for #${subPlayer.number} ${subPlayer.name}`;
          subLog.appendChild(li);
        } else alert('Invalid back-row player number!');
      }
    } else {
      const available = roster.filter(p => p.number !== player.number);
      const subName = prompt(`Sub out #${player.number} ${player.name}. Enter number of new player:\nAvailable: ${available.map(p=>'#'+p.number).join(', ')}`);
      if(subName){
        const newNumber = parseInt(subName);
        const newPlayer = available.find(p=>p.number===newNumber);
        if(newPlayer){
          document.getElementById('player-' + player.number).remove();
          addPlayerToCourt(newPlayer, rotationCoords[Math.floor(Math.random()*6)].x, rotationCoords[Math.floor(Math.random()*6)].y);
          const li = document.createElement('li');
          li.textContent = `#${player.number} ${player.name} → #${newPlayer.number} ${newPlayer.name}`;
          subLog.appendChild(li);
        } else alert('Invalid player number!');
      }
    }
  } else alert('Unknown action. Type "sub" or "name".');
}

// Save setup
document.getElementById('saveBtn').addEventListener('click', () => {
  const setup = [];
  document.querySelectorAll('.player').forEach(p => {
    setup.push({
      id: p.id,
      number: p.textContent,
      top: p.style.top,
      left: p.style.left,
      libero: p.classList.contains('libero'),
      rotation: p.dataset.rotation || null
    });
  });
  localStorage.setItem('courtSetup', JSON.stringify(setup));
  alert('Setup saved!');
});
