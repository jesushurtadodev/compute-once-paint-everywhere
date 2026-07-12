# Post 6 — "My test suite was green. It was also lying."

> Capítulo 6 de la serie DOPE.
> Publicar cuando la feature de favoritos autenticados cierre en verde REAL.
> Rellenar [PENDIENTE]. Es el capítulo de "silence is not success" aplicado a los tests.

---

## English

**My cross-platform test suite passed. Then I read it, and it had never been able to fail.**

Chapter six of the DOPE series at AudioRel.

Context: I'd shipped a "favorite a story" feature across three platforms and written the acceptance test my own methodology demands — the same user marks a favorite on one surface, it must appear on the other two. Green checkmark. Done, by my own definition.

Except I asked two AI agents to actually RUN it against production, on a real iOS simulator and a real Android emulator. That's when it got interesting.

🔍 **The test was vacuous.** Every assertion was marked `optional: true`. In plain terms: a test that logs a warning instead of failing. It ran as a guest — never even authenticated as the test user — and its selectors didn't match the real buttons. It was a green light wired to nothing. **A test that cannot fail is worse than no test: it's a lie that looks like proof.**

🔍 **And underneath it, a real bug it should have caught.** On iOS, opening a story from a Collection hardcoded `isFavorite: false` and hid the heart entirely. So a favorite you saved on the web would simply not render on your iPhone — the button wasn't even there. The vacuous test had been cheerfully green over a genuinely broken feature.

🔍 **Then a rabbit hole that wasn't one.** Both agents flagged a possible bug: the toggle endpoint "added twice instead of toggling." I almost believed it — two independent reports. So I tested it directly: five sequential toggles, true/false/true/false/true. Perfect. The agents had fired their toggles too fast and read stale state. *Verify the claim, even when two sources agree.*

The real lesson wasn't the bug. It was the **stopping question**: if this feature broke right now, would my test say anything? Mine wouldn't. It was decoration.

And the fix reframed the whole thing. The test couldn't authenticate because our app has no password login — only magic-link and Google. Which surfaced the actual product question I'd been dodging: **is a favorite something an anonymous person can have?** No. A favorite is "save this to *my* account." So favorites become authenticated-only — heart always visible, guest taps it, we remember the pending favorite, send them to log in, then apply it and land them on their saved list. One clean decision closed the bug, the fake test, AND the auth question at once.

Final tally: [PENDIENTE] — the vacuous test rewritten to fail honestly, the iOS render bug fixed, the auth model decided and documented.

Your CI is green. When did you last read a test and ask: *could this ever have failed?*

---

## Español

**Mi suite de tests cross-platform pasó. Luego la leí, y nunca había podido fallar.**

Sexto capítulo de la serie DOPE en AudioRel.

Contexto: había sacado una feature de "marcar cuento como favorito" en tres plataformas y escrito el test de aceptación que mi propia metodología exige — el mismo usuario marca favorito en una superficie, debe aparecer en las otras dos. Check verde. Hecho, según mi propia definición.

Salvo que pedí a dos agentes de IA que lo CORRIERAN de verdad contra producción, en un simulador iOS y un emulador Android reales. Ahí se puso interesante.

🔍 **El test era vacuo.** Cada aserción estaba marcada `optional: true`. En cristiano: un test que loguea un warning en vez de fallar. Corría como invitado —ni siquiera se autenticaba como el usuario de test— y sus selectores no casaban con los botones reales. Un semáforo verde conectado a nada. **Un test que no puede fallar es peor que no tener test: es una mentira con pinta de prueba.**

🔍 **Y debajo, un bug real que debería haber cazado.** En iOS, abrir un cuento desde una Colección hardcodeaba `isFavorite: false` y ocultaba el corazón entero. Así que un favorito guardado en la web simplemente no se pintaba en tu iPhone — el botón ni estaba. El test vacuo llevaba tiempo alegremente verde sobre una feature genuinamente rota.

🔍 **Luego un callejón que no lo era.** Ambos agentes señalaron un posible bug: el endpoint de toggle "añadía dos veces en vez de togglear". Casi me lo creo — dos reportes independientes. Así que lo probé directo: cinco toggles seguidos, true/false/true/false/true. Perfecto. Los agentes dispararon sus toggles demasiado rápido y leyeron estado viejo. *Verifica la afirmación, aunque dos fuentes coincidan.*

La lección de verdad no fue el bug. Fue la **pregunta que detiene**: si esta feature se rompiera ahora mismo, ¿diría algo mi test? El mío no. Era decoración.

Y el arreglo lo reencuadró todo. El test no podía autenticar porque nuestra app no tiene login por contraseña — solo magic-link y Google. Lo que sacó a flote la pregunta de producto que llevaba esquivando: **¿un favorito es algo que puede tener un anónimo?** No. Un favorito es "guárdame esto en *mi* cuenta". Así que favoritos pasa a ser solo-autenticado — corazón siempre visible, el invitado lo toca, recordamos el favorito pendiente, lo mandamos a login, luego lo aplicamos y lo llevamos a su lista guardada. Una decisión limpia cerró el bug, el test falso Y la pregunta de auth a la vez.

Balance final: [PENDIENTE] — el test vacuo reescrito para fallar honestamente, el bug de render iOS arreglado, el modelo de auth decidido y documentado.

Tu CI está en verde. ¿Cuándo leíste por última vez un test y preguntaste: *esto, ¿alguna vez pudo fallar?*

---

# 📌 PRIMER COMENTARIO
> 🇪🇸 Versión en español 👇
> 📖 Playbook + skill + DoD, open source: https://github.com/jesushurtadodev/dope-architecture
> 🌐 https://jesushurtado.dev
