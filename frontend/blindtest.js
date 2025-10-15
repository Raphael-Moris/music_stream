let questions = [];
let current = 0;
let score = 0;
let timer;
let startTime;

document.getElementById('startBtn').onclick = async () => {
  const genre = document.getElementById('genre').value;
  const res = await fetch(`/api/blindtest/solo?genre=${genre}`);
  questions = await res.json();
  current = 0;
  score = 0;
  document.getElementById('score').textContent = `Score : ${score}`;
  document.getElementById('game').style.display = '';
  showQuestion();
};

function showQuestion() {
  if (current >= questions.length) {
    alert(`Partie terminée ! Score final : ${score}`);
    document.getElementById('game').style.display = 'none';
    return;
  }
  const q = questions[current];
  document.getElementById('question').textContent = `Titre n°${current + 1}`;
  document.getElementById('audio').src = q.song.url; // Assure-toi que le champ s'appelle bien 'url'
  const optionsDiv = document.getElementById('options');
  optionsDiv.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = () => answer(opt, q.song.title);
    optionsDiv.appendChild(btn);
  });
  startTime = Date.now();
}

function answer(selected, correct) {
  let bonus = 0;
  const time = (Date.now() - startTime) / 1000;
  if (selected === correct) {
    if (time < 3) bonus = 50;
    else if (time < 7) bonus = 20;
    score += 100 + bonus;
  } else {
    score -= 10;
  }
  document.getElementById('score').textContent = `Score : ${score}`;
  current++;
  showQuestion();
}

document.getElementById('skipBtn').onclick = () => {
  score -= 10;
  document.getElementById('score').textContent = `Score : ${score}`;
  current++;
  showQuestion();
};