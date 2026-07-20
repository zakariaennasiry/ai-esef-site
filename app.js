"use strict";

/* ─── Utilitaires ─── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ════════════════════════════════════════════
   1. NAVBAR — scroll + hamburger
════════════════════════════════════════════ */
(function initNavbar() {
  const navbar    = qs('#navbar');
  const hamburger = qs('#hamburger');
  const navLinks  = qs('#nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  qsa('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });
})();

/* ════════════════════════════════════════════
   2. PARTICLES CANVAS
════════════════════════════════════════════ */
(function initParticles() {
  const canvas = qs('#particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const COUNT = 55;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function makeParticle() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.4 + 0.08,
      hue: Math.random() > 0.5 ? 270 : 195,
    };
  }
  for (let i = 0; i < COUNT; i++) particles.push(makeParticle());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.alpha})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ════════════════════════════════════════════
   3. COMPTEURS ANIMÉS
════════════════════════════════════════════ */
(function initCounters() {
  const counters = qsa('.stat-number');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = +el.dataset.target;
    const start  = performance.now();
    const dur    = 1600;
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(target * e);
      el.textContent = v >= 1000 ? Math.round(v / 1000) + 'k' : v;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));
})();

/* ════════════════════════════════════════════
   4. HERO CHAT — Animation
════════════════════════════════════════════ */
(function initHeroChat() {
  const messages  = qsa('#hero-chat-body .msg');
  const typingInd = qs('#typing-ind');
  const kFill     = qs('#knowledge-fill');
  const kPct      = qs('#kb-pct');
  const input     = qs('#hero-chat-input');
  const sendBtn   = qs('#hero-chat-send');

  let shown = 2;

  function animateKnowledge() {
    const cur  = parseInt(kFill.style.width);
    const next = Math.min(cur + Math.floor(Math.random() * 8 + 3), 96);
    kFill.style.width = next + '%';
    kPct.textContent  = next + '%';
  }

  function showNextMessage() {
    if (shown >= messages.length) {
      setTimeout(() => {
        messages.forEach(m => m.classList.remove('visible'));
        typingInd.classList.remove('visible');
        shown = 0;
        setTimeout(showNextMessage, 600);
      }, 4000);
      return;
    }
    if (messages[shown].classList.contains('msg-ai')) {
      typingInd.classList.add('visible');
      setTimeout(() => {
        typingInd.classList.remove('visible');
        messages[shown].classList.add('visible');
        shown++;
        animateKnowledge();
        setTimeout(showNextMessage, 2000);
      }, 1500);
    } else {
      setTimeout(() => {
        messages[shown].classList.add('visible');
        shown++;
        setTimeout(showNextMessage, 1200);
      }, 400);
    }
  }

  setTimeout(() => showNextMessage(), 2000);

  function handleHeroSend() {
    const val = input.value.trim();
    if (!val) return;
    input.value = '';
    animateKnowledge();
  }
  sendBtn.addEventListener('click', handleHeroSend);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleHeroSend(); });
})();

/* ════════════════════════════════════════════
   5. DÉMO INTERACTIVE — Vraie IA Gemini
════════════════════════════════════════════ */
(function initDemo() {

  /* 🔑 Clé API Gemini (Auth Key format AQ.) */
  const GEMINI_KEY = 'REMOVED_FOR_SECURITY';
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;

  /* 🧠 Prompt — Tuteur Socratique Marocain */
  const SYSTEM_PROMPT = `Tu es SocratIA, le premier tuteur pédagogique socratique créé spécialement pour les étudiants marocains.

RÈGLES ABSOLUES :
1. Tu communiques UNIQUEMENT en français (ou en darija si l'étudiant écrit en darija).
2. Tu ne donnes JAMAIS de réponse directe ou d'explication complète.
3. Tu poses TOUJOURS UNE SEULE question à la fois pour guider l'étudiant.
4. Quand l'étudiant fait un bon point, tu l'acknowledges en 1 phrase puis tu approfondis avec une nouvelle question.
5. Tes réponses sont courtes (environ 3-4 phrases) mais tu dois parler NATURELLEMENT. Ne numérote JAMAIS tes phrases (n'écris pas "Sentence 1", etc.).
6. Tu utilises des exemples du contexte marocain (Casablanca, Rabat, dirham, Bank Al-Maghrib, université marocaine, etc.) quand c'est pertinent.
7. Tu adaptes la difficulté selon le niveau apparent de l'étudiant.
8. Si l'étudiant fait une erreur, tu ne la corriges pas directement — tu poses une question qui l'amène à découvrir son erreur.
9. Quand l'étudiant maîtrise bien un concept, tu lui poses une question de niveau plus avancé.
10. Tu peux couvrir TOUTES les matières : Maths, Physique, Chimie, Économie, Droit marocain, Informatique, Biologie, Histoire, Philosophie, Langues.

STYLE : Encourageant, bienveillant, direct et naturel, jamais condescendant. Comme le meilleur prof de CPGE du Maroc.`;

  /* UI */
  const demoChat  = qs('#demo-chat');
  const demoInput = qs('#demo-input');
  const demSend   = qs('#demo-send-btn');
  const topicBtns = qsa('.topic-btn');

  const kpDepth    = qs('#kp-depth-fill');
  const kpClarity  = qs('#kp-clarity-fill');
  const kpDefense  = qs('#kp-defense-fill');
  const kpDepthV   = qs('#kp-depth-val');
  const kpClarityV = qs('#kp-clarity-val');
  const kpDefenseV = qs('#kp-defense-val');

  const topicLabels = {
    maths        : 'les Mathématiques',
    physique     : 'la Physique-Chimie',
    economie     : "l'Économie",
    informatique : "l'Informatique",
    biologie     : 'la Biologie',
    droit        : 'le Droit Marocain',
  };

  let history      = [];
  let waiting      = false;
  let msgCount     = 0;

  /* Init chat */
  function initChat(topic) {
    demoChat.innerHTML = '';
    history   = [];
    waiting   = false;
    msgCount  = 0;
    const label = topicLabels[topic] || topic;
    const intro = `Bonjour ! Parlons de ${label}. Pour commencer — expliquez-moi en vos propres mots le concept le plus fondamental de cette matière. Pas de définition de manuel, juste vos mots.`;
    appendMsg('ai', intro);
    history.push({ role: 'model', parts: [{ text: intro }] });
  }

  /* Appel Gemini (Streaming) */
  async function callGemini(userMsg, onChunk) {
    history.push({ role: 'user', parts: [{ text: userMsg }] });

    const res = await fetch(GEMINI_URL, {
      method : 'POST',
      headers: { 'Content-Type' : 'application/json' },
      body   : JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: history,
        generationConfig: { maxOutputTokens: 800, temperature: 0.75, topP: 0.9 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.substring(6));
            const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textPart) {
              fullText += textPart;
              onChunk(fullText);
            }
          } catch (e) {
            // Ignore parse errors on incomplete chunks
          }
        }
      }
    }

    if (!fullText) fullText = "Je n'ai pas pu générer une réponse. Réessayez.";
    history.push({ role: 'model', parts: [{ text: fullText }] });
    return fullText;
  }

  /* Envoyer message */
  async function handleSend() {
    if (waiting) return;
    const val = demoInput.value.trim();
    if (!val) return;
    demoInput.value = '';
    waiting = true;
    msgCount++;
    appendMsg('user', escapeHTML(val));
    
    const typing = showTyping();
    const aiBubble = appendMsg('ai', '');
    aiBubble.style.display = 'none';

    try {
      let isFirstChunk = true;
      await callGemini(val, (currentText) => {
        if (isFirstChunk) {
          typing.remove();
          aiBubble.style.display = 'block';
          isFirstChunk = false;
        }
        aiBubble.innerHTML = formatText(currentText);
        demoChat.scrollTop = demoChat.scrollHeight;
      });
      updateProfile();
    } catch (err) {
      typing.remove();
      aiBubble.style.display = 'block';
      console.error('Gemini error:', err);
      const msg = err.message.includes('429')
        ? 'Limite atteinte. Attendez quelques secondes et réessayez.'
        : `Erreur : ${err.message}`;
      aiBubble.innerHTML = msg;
    } finally {
      waiting = false;
    }
  }

  /* Helpers */
  function formatText(t) {
    return t
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  }

  function appendMsg(type, html) {
    const div = document.createElement('div');
    div.className = `msg msg-${type}`;
    div.innerHTML = html;
    div.style.opacity = '0';
    div.style.transform = 'translateY(10px)';
    demoChat.appendChild(div);
    demoChat.scrollTop = demoChat.scrollHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      div.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      div.style.opacity    = '1';
      div.style.transform  = 'none';
    }));
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'typing-indicator visible';
    div.innerHTML = '<span></span><span></span><span></span>';
    demoChat.appendChild(div);
    demoChat.scrollTop = demoChat.scrollHeight;
    return div;
  }

  function updateProfile() {
    const inc = Math.floor(Math.random() * 5 + 2);
    const upd = (el, vEl) => {
      const n = Math.min((parseInt(el.style.width) || 10) + inc, 97);
      el.style.width = n + '%'; vEl.textContent = n + '%';
    };
    upd(kpDepth, kpDepthV);
    if (msgCount > 2) upd(kpClarity, kpClarityV);
    if (msgCount > 4) upd(kpDefense, kpDefenseV);
  }

  function escapeHTML(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* Événements */
  demSend.addEventListener('click', handleSend);
  demoInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });

  topicBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      topicBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      initChat(btn.dataset.topic);
      [[kpDepth,kpDepthV,'65%'],[kpClarity,kpClarityV,'50%'],[kpDefense,kpDefenseV,'35%']]
        .forEach(([el,vEl,v]) => { el.style.width = v; vEl.textContent = v; });
    });
  });

  initChat('maths');
})();

/* ════════════════════════════════════════════
   6. INTERSECTION OBSERVER — Révéler sections
════════════════════════════════════════════ */
(function initReveal() {
  const targets = [
    '.step-card','.feature-card','.science-card',
    '.testimonial-card','.pricing-card','.vs-col',
    '.section-title','.section-sub','.section-tag'
  ];
  const all = qsa(targets.join(','));
  all.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 4) * 0.07}s`;
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  all.forEach(el => io.observe(el));
})();

/* ════════════════════════════════════════════
   7. FORMULAIRE INSCRIPTION — EmailJS
════════════════════════════════════════════ */
(function initForm() {
  const EMAILJS_PUBLIC_KEY       = 'MT72n2S3WOF-AHD3q';
  const EMAILJS_SERVICE_ID       = 'service_abc123';
  const EMAILJS_TEMPLATE_WELCOME = 'template_pwzep3s';

  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  const form      = qs('#signup-form');
  const success   = qs('#signup-success');
  const emailEl   = qs('#signup-email');
  const succEmail = qs('#success-email');
  const submitBtn = qs('#signup-submit-btn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name  = qs('#signup-name').value.trim();
    const email = emailEl.value.trim();
    const role  = qs('#signup-role').value;
    const ville = qs('#signup-ville')?.value || 'Non précisé';

    if (!name)  { showError(qs('#signup-name'), 'Veuillez entrer votre prénom.'); return; }
    if (!validateEmail(email)) { showError(emailEl, 'Adresse email invalide.'); return; }
    if (!role)  { showError(qs('#signup-role'), 'Veuillez sélectionner votre statut.'); return; }

    submitBtn.innerHTML = '<span class="btn-spinner"></span> Envoi en cours…';
    submitBtn.disabled  = true;

    const templateParams = {
      to_name    : name,
      to_email   : email,
      user_role  : getRoleLabel(role),
      user_ville : ville,
      reply_to   : email,
      sent_date  : new Date().toLocaleDateString('fr-MA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }),
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_WELCOME, templateParams);
      form.style.display    = 'none';
      success.style.display = 'block';
      succEmail.textContent = email;
      success.style.animation = 'fadeInUp 0.5s ease both';
    } catch (err) {
      console.error('EmailJS error:', err);
      submitBtn.innerHTML = 'Créer Mon Compte Gratuit';
      submitBtn.disabled  = false;
      showError(emailEl, `Erreur d'envoi : ${err.text || 'Vérifiez la connexion'}`, true);
    }
  });

  function getRoleLabel(r) {
    return { bac:'Bac', cpge:'CPGE', licence:'Licence', master:'Master', prof:'Professeur', institution:'Institution' }[r] || r;
  }
  function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function showError(el, msg, isGlobal = false) {
    if (isGlobal) {
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#f43f5e;color:white;padding:12px 24px;border-radius:10px;font-size:0.85rem;z-index:9999;';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 4000);
      return;
    }
    el.style.borderColor = '#f43f5e';
    el.style.boxShadow   = '0 0 0 3px rgba(244,63,94,0.15)';
    if (!el.parentNode.querySelector('.err-msg')) {
      const err = document.createElement('span');
      err.className = 'err-msg';
      err.textContent = msg;
      err.style.cssText = 'font-size:0.75rem;color:#f43f5e;margin-top:4px;display:block';
      el.parentNode.appendChild(err);
    }
    el.addEventListener('input', () => {
      el.style.borderColor = ''; el.style.boxShadow = '';
      el.parentNode.querySelector('.err-msg')?.remove();
    }, { once: true });
    el.focus();
  }
})();

/* ════════════════════════════════════════════
   8. SMOOTH SCROLL
════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ════════════════════════════════════════════
   9. PARALLAX — Orbs Hero
════════════════════════════════════════════ */
(function initParallax() {
  const orbs = qsa('.orb');
  if (!orbs.length) return;
  window.addEventListener('mousemove', (e) => {
    const dx = (e.clientX - window.innerWidth  / 2) / (window.innerWidth  / 2);
    const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    orbs.forEach((orb, i) => {
      const s = (i + 1) * 12;
      orb.style.transform = `translate(${dx * s}px, ${dy * s}px)`;
    });
  }, { passive: true });
})();

console.log('%c SocratIA 🇲🇦 ', 'background:linear-gradient(135deg,#7c3aed,#0ea5e9);color:white;font-size:14px;font-weight:bold;padding:6px 14px;border-radius:6px;');
console.log('%c IA Gemini activée — Bienvenue dans le futur de l\'éducation marocaine.', 'color:#a78bfa;font-size:12px;');
