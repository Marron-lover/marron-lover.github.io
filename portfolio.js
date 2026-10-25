'use strict';
const stages=[['Collection & continuity','Resumable collection and stage-level tracking keep long-running workflows inspectable when sources or workers change.'],['Quality filtering','Quality checks select usable images before expensive review and later processing. Coverage checks and review samples help reveal gaps.'],['Perceptual deduplication','Perceptual comparisons identify visually repeated material, beyond identical file hashes.'],['Model-assisted review','Vision-language screening supports classification and coverage review, with samples available for inspection.'],['Storage & traceability','Cloud object storage and stage-level tracking connect processed records to their source and workflow state.']];
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let stageAnimation;
document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-stage]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});
 const [title,description]=stages[Number(button.dataset.stage)];
 stageAnimation?.kill();
 document.querySelector('#stage-label').textContent=title;document.querySelector('#stage-description').textContent=description;
 if(window.gsap&&!reduced.matches)stageAnimation=gsap.fromTo('.stage-note',{y:7,autoAlpha:.5},{y:0,autoAlpha:1,duration:.3,ease:'power2.out'});
}));
if(window.gsap&&!reduced.matches){const entrance=gsap.timeline({defaults:{ease:'power3.out'}});entrance.from('.intro h1',{y:24,autoAlpha:0,duration:.8}).from('.intro-bottom',{y:12,autoAlpha:0,duration:.55},'-.4');window.addEventListener('pagehide',()=>{entrance.kill();stageAnimation?.kill()},{once:true})}
