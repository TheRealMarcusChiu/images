/* ──────────────────────────────────────────────────────────────────────────
   Gallery content — the single source of truth.

   Loaded directly by index.html via <script>, so it works on both file:// and
   GitHub Pages with NO build step. script.js derives everything else at
   runtime: it sorts by `date` (newest first), formats the displayed timestamp,
   builds the media URL from `file`, and measures each image's aspect ratio.

   To add an item, append an object below. Fields:
     type   "image" | "video" | "audio" | "youtube"          (required)
     date   ISO 8601, e.g. "2025-04-02T09:15:00.000-05:00"   (required)
     file   filename in content/media/   (required for image/video/audio)
     id     YouTube video id             (required for youtube)
     title  track name shown in the audio player & queue   (optional; audio)
     desc   hover caption                (optional)
     link   external URL; tile becomes clickable   (optional; image/video/audio)
     poster filename in content/media/ — video thumbnail or audio cover (optional)
   ────────────────────────────────────────────────────────────────────────── */
window.GALLERY_ITEMS = [
  { type: "image", date: "2026-08-08T22:41:25.611-05:00", file: "2026-08-08T22:41:25.611-05:00.png",
    tags: ["solar system","gravity visualization","spacetime curvature","planetary orbits","sun gravitational effect","scientific illustration","cosmic phenomena","astronomy diagram","relativity concept","space physics"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-08-07T21:25:17.406-05:00",
    quote: "To love the LORD: it's when I wanna go left, my fear of the LORD makes me go right" },

  { type: "quote", date: "2026-08-07T14:49:16.843-05:00",
    quote: "Indians are always in a hurry yet never on time", author: "said by an Indian" },

  { type: "youtube", date: "2026-08-07T13:30:01.129-05:00", id: "9lY4j-Y1Sdg" },

  { type: "quote", date: "2026-08-06T14:22:42.804-05:00",
    quote: "profession of faith vs possession of faith" },

  { type: "image", date: "2026-08-06T14:11:47.585-05:00", file: "2026-08-06T14:11:47.585-05:00.png",
    tags: ["book page","text quote","philosophical quote","life advice","quote about leaving","paper texture","printed text","book interior","page corner","book text"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:11:33.600-05:00", file: "2026-08-06T14:11:33.600-05:00.webp",
    tags: ["man holding microphone","outdoor street scene","trees","bridge","people walking","urban environment","hoodie","text overlay","London landmark","public space"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:11:20.497-05:00", file: "2026-08-06T14:11:20.497-05:00.webp",
    tags: ["color circles","fingerprint patterns","emotions experience","emotions identity","text design","minimalist art","color psychology","visual metaphor","four colors","circular shapes"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:11:08.743-05:00", file: "2026-08-06T14:11:08.743-05:00.webp",
    tags: ["computer room","electronic equipment","circuit boards","wiring","control panel","technical workspace","industrial machinery","electrical components","data center","vintage technology"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:10:58.066-05:00", file: "2026-08-06T14:10:58.066-05:00.webp",
    tags: ["Spotify billboard","urban cityscape","large digital advertisement","remote work","city street","office building","pedestrians","glass skyscrapers","Spotify logo","public messaging"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:10:47.797-05:00", file: "2026-08-06T14:10:47.797-05:00.webp",
    tags: ["bed","cat","woman","phone","text message","sleeping","blue blanket","meme","thoughts","sadness"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:10:36.993-05:00", file: "2026-08-06T14:10:36.993-05:00.webp",
    tags: ["mathematics landscape","algebraic geometry","numerical analysis","harmonic analysis","differential topology","combinatorial group theory","quantum cohomology","modern mathematics","cartoon","mountain peaks"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:10:24.394-05:00", file: "2026-08-06T14:10:24.394-05:00.webp",
    tags: ["muscle cross-section","MRI scan","triathlete","sedentary man","quadriceps","adipose tissue","age comparison","medical imaging","anatomy","muscle density"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:10:08.353-05:00", file: "2026-08-06T14:10:08.353-05:00.webp",
    tags: ["night scene","silhouettes","road","text overlay","couple","walking","car","bridge","back view","romantic"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:09:58.455-05:00", file: "2026-08-06T14:09:58.455-05:00.webp",
    tags: ["missing poster","cat","text","photograph","black and white","collage","cat collar","emotional expression","missing person","you so much"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:09:46.363-05:00", file: "2026-08-06T14:09:46.363-05:00.webp",
    tags: ["two cats","sunlight through window","stained glass window","cat on rug","indoor setting","warm lighting","text overlay","cat sitting","home interior","cat and cat"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T14:09:35.245-05:00", file: "2026-08-06T14:09:35.245-05:00.webp",
    tags: ["hummingbird","flower","nectar","relaxing","bird","nature","bloom","insect","animal","photography"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T13:56:16.706-05:00", file: "2026-08-06T13:56:16.706-05:00.webp",
    tags: ["space station","flying saucer","red cloak","clouds","computer monitor","large window","astronaut","cosmic background","ancient architecture","science fiction"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T13:56:01.462-05:00", file: "2026-08-06T13:56:01.462-05:00.webp",
    desc: "\"I love you\" in Kazakh is \"Men seni zhaksy koremin\" which means \"I see you clearly\"", tags: ["Kazakh culture","sheep herding","horse","mountain landscape","text overlay","Kazakh language","friendship","love","text translation","grassland"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T13:55:51.172-05:00", file: "2026-08-06T13:55:51.172-05:00.webp",
    tags: ["Twitter tweet","deleted tweet","social media","Tinder","Grindr","dating apps","gay lifestyle","public image","messaging","love"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-08-06T13:55:40.461-05:00", file: "2026-08-06T13:55:40.461-05:00.webp",
    tags: ["skeleton holding cat","dead inside","sick of life","cat lover","meme","four panel comic","skull and cat","emotional support cat","dark humor","cat and skeleton"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-08-06T01:05:24.754-05:00",
    quote: "We live in an age that demands apology for greatness" },

  { type: "image", date: "2026-08-05T12:07:23.373-05:00", file: "2026-08-05T12:07:23.373-05:00.webp",
    desc: "If you want to go the fastest, go alone. If you want to go the farthest, go with company." },

  { type: "quote", date: "2026-08-05T12:00:55.251-05:00",
    quote: "Trust in the LORD with all your heart;\r\ndo not depend on your own understanding.\r\nSeek his will in all you do,\r\nand he will show you which path to take.", author: "Proverbs 3:5–6 (NLT)" },

  { type: "image", date: "2026-08-04T22:33:53.228-05:00", file: "2026-08-04T22:33:53.228-05:00.png",
    link: "https://share.google/x5wVsF7jthIiGgnB5", tags: ["chipotle mexican grill review","1 star review","gold coin payment","employee mistake","remake order denial","customer complaint","restaurant service issue","owner accountability","pay it forward","food service rating"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-07-30T00:30:28.361-05:00",
    quote: "Don't cry cause its over. Smile cause it happened" },

  { type: "image", date: "2026-07-29T14:26:09.176-05:00", file: "2026-07-29T14:26:09.176-05:00.jpeg",
    tags: ["movie poster","Eternal Sunshine of the Spotless Mind","two people","blue hair","yellow grid background","clouds","coat","boots","hat","scarf"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-07-29T09:37:07.817-05:00",
    quote: "Don't you know that when you sleep with someone, your body makes a promise, whether you do or not?", author: "Vanilla Sky" },

  { type: "youtube", date: "2026-07-27T22:16:53.827-05:00", id: "ZhL2LJ4CpsU" },

  { type: "quote", date: "2026-07-27T14:10:19.026-05:00",
    quote: "Mercy and truth have met together; righteousness and peace have kissed.", author: "Psalm 85:10 (NKJV)" },

  { type: "quote", date: "2026-07-27T10:14:10.656-05:00",
    quote: "We don't go to counseling because our marriage is failing; we go because our marriage matters", author: "A Helpful Mindset" },

  { type: "quote", date: "2026-07-27T09:49:22.516-05:00",
    quote: "Everything that comes from you, goes back to you", author: "Paul Washer" },

  { type: "image", date: "2026-07-27T00:09:51.556-05:00", file: "2026-07-27T00:09:51.556-05:00.png",
    desc: "made matcha macarons with butter cream filling!", tags: ["green macaron","hand holding macaron","macaron filling","macaron shells","plastic container","white surface","food photography","dessert","confectionery","mochi-like filling"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-26T21:59:26.825-05:00", file: "2026-07-26T21:59:26.825-05:00.png",
    tags: ["batman costume","pregnant woman","subway train","experiment","seat offering","public transportation","social experiment","passengers","urban setting","costume wearer"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-07-24T03:51:46.500-05:00",
    quote: "relationship advice: under-promise, over-deliver" },

  { type: "image", date: "2026-07-24T01:17:44.967-05:00", file: "2026-07-24T01:17:44.967-05:00.png",
    tags: ["pixel art","dinosaur","wishes","comedy","text bubbles","cactus","fireworks","Gary","thousand wishes","cartoon"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-22T12:05:06.290-05:00", file: "2026-07-22T12:05:06.290-05:00.png",
    tags: ["diary entry","Leo Tolstoy","1851","January 25","love","party","horse purchase","Russian literature"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-22T12:04:54.238-05:00", file: "2026-07-22T12:04:54.238-05:00.png" },

  { type: "youtube", date: "2026-07-21T00:57:05.329-05:00", id: "pUb3mJhv_TU" },

  { type: "quote", date: "2026-07-20T12:37:39.511-05:00",
    quote: "Mental pain is less dramatic than physical pain, but it is more common and also more hard to bear. The frequent attempt to conceal mental pain increases the burden: it is easier to say “my tooth is aching” than to say “my heart is broken.”", author: "C.S. Lewis" },

  { type: "quote", date: "2026-07-20T12:31:41.127-05:00",
    quote: "If you want to go fast, go alone. If you want to go far, go together" },

  { type: "quote", date: "2026-07-20T00:19:46.035-05:00",
    quote: "i'm sorry" },

  { type: "image", date: "2026-07-19T23:18:14.259-05:00", file: "2026-07-19T23:18:14.259-05:00.jpeg",
    tags: ["corsair vengeance dd5","ddr5 ram","128gb memory","6400mhz","computer hardware","memory module","yellow packaging","price tag","retail display","computer parts"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-19T23:17:00.543-05:00", file: "2026-07-19T23:17:00.543-05:00.jpeg",
    tags: ["login options","social media login","app login buttons","digital authentication","user interface","screen capture","computer monitor","login with mom","login with PDF","login with calculator"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-18T22:40:38.760-05:00", file: "2026-07-18T22:40:38.760-05:00.webp",
    tags: ["Pokémon card","Eevee GX","Ascension-DNA","Joy Maker GX","collectible card","card price tag","$160","holographic card","card shop","card display"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-18T22:40:25.024-05:00", file: "2026-07-18T22:40:25.024-05:00.jpeg",
    tags: ["historic building","city street","architectural details","pedestrians crossing","sunny day","urban intersection","stone facade","arched windows","British Empire Building","street signs"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-07-15T23:08:30.583-05:00",
    quote: "For now we see only a reflection as in a mirror; then we shall see face to face. Now I know in part; then I shall know fully, even as I am fully known.", author: "1 Corinthians 13:12" },

  { type: "image", date: "2026-07-15T14:51:41.815-05:00", file: "2026-07-15T14:51:41.815-05:00.png",
    desc: "I really loved you. There was always a small hope, deep inside me, that we'd end up together... but we never did.\nI don't want to let you go, I really don't. But I have to, I would be too lucky, you deserved better.\nThere's still this \"why?\" inside me, but I have let go for your happiness. \nStay happy, my love." },

  { type: "image", date: "2026-07-15T14:44:40.847-05:00", file: "2026-07-15T14:44:40.847-05:00.jpeg",
    desc: "my first batch of cookies - crisped edges, chewy middle 🤤 - matcha white chocolate macadamia nut cookies", tags: ["green dumplings","aluminum foil tray","hand holding tray","round food items","baked goods","homemade food","food preparation","foil-lined baking sheet","dark green balls","food photography"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-15T14:24:08.521-05:00", file: "2026-07-15T14:24:08.521-05:00.png",
    tags: ["sketch drawing","coffee table book","social gathering","handwritten text","group illustration","monochrome art","conversation theme","people interaction","artbook","social media post"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-07-15T14:20:34.220-05:00",
    quote: "dress for beauty not for lust" },

  { type: "quote", date: "2026-07-14T15:39:07.818-05:00",
    quote: "be grateful when there's an opportunity to help someone" },

  { type: "image", date: "2026-07-14T14:23:59.205-05:00", file: "2026-07-14T14:23:59.205-05:00.webp",
    tags: ["cartoon dog","glasses","laptop","coffee cup","text overlay","work focus","sweat drops","relaxed expression","minimalist art","beige background"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-14T14:23:44.555-05:00", file: "2026-07-14T14:23:44.555-05:00.webp",
    tags: ["alphabet with cats","cat lettering","hand-drawn alphabet","cat illustrations","grid paper","uppercase letters","cat faces","letter A to Z","cute cats","cat alphabet"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-14T14:23:30.099-05:00", file: "2026-07-14T14:23:30.099-05:00.webp",
    tags: ["love quote","waiting metaphor","lover's identity","punctuality","relationship philosophy"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-14T14:22:34.061-05:00", file: "2026-07-14T14:22:34.061-05:00.webp",
    tags: ["beach","golden gate bridge","sunset","people","sand","ocean","fog","hiking","coastal","california"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-14T14:18:29.083-05:00", file: "2026-07-14T14:18:29.083-05:00.webp",
    tags: ["dog","cat","flower bouquet","puppy","kitten","sidewalk","grass","outdoor","gift","bouquet"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-14T14:18:17.548-05:00", file: "2026-07-14T14:18:17.548-05:00.webp",
    tags: ["love quote","relationship advice","friendship definition","family definition","romance definition","mirroring metaphor","light metaphor","gentle work","steadfast work","life work"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-14T14:17:42.339-05:00", file: "2026-07-14T14:17:42.339-05:00.png",
    tags: ["modern lounge","striped sofas","colorful cushions","industrial chandelier","interior design","high ceiling","bar area","decorative lighting","multi-level space","stone feature"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-14T14:17:16.409-05:00", file: "2026-07-14T14:17:16.409-05:00.webp",
    tags: ["friendship letter","personal note","day 6","written message","supportive message","book page","social media post","morganwallen","original audio","saved content"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-07-14T13:55:07.747-05:00",
    quote: "a guilty conscience is a gift to a non-repentant mind" },

  { type: "quote", date: "2026-07-13T19:25:40.385-05:00",
    quote: "I really want to know who he knows", author: "Someone to a faithful person" },

  { type: "quote", date: "2026-07-13T19:21:50.388-05:00",
    quote: "He's not leading a service, he's worshipping a Savior.", author: "Someone to a Pastor" },

  { type: "quote", date: "2026-07-12T23:40:28.359-05:00",
    quote: "mad midnight moments" },

  { type: "quote", date: "2026-07-08T16:34:07.836-05:00",
    quote: "what's better than having all the answers, is peace that surpasses all understanding" },

  { type: "image", date: "2026-07-08T01:59:40.059-05:00", file: "2026-07-08T01:59:40.059-05:00.jpeg",
    desc: "John Owen", link: "https://www.thechristianexplorer.org/post/2018/11/01/john-owen-fortitude-in-suffering", tags: ["portrait of isaac newton","17th century portrait","baroque style","long curly hair","black cap","white collar","historical figure","scientific figure","oil painting","dark background"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-08T00:53:28.456-05:00", file: "2026-07-08T00:53:28.456-05:00.jpg",
    desc: "so shall i be helpful at the cost of happiness", tags: ["robot","wild robot","lupita nyong'o","dreamworks","animated movie","theater release","nature background","large eyes","robot hand","coming soon"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-07T01:37:26.163-05:00", file: "2026-07-07T01:37:26.163-05:00.webp",
    tags: ["grief","absence","emotional pain","missing someone","personal reflection","heartache","loneliness","memory","sadness","loss"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-05T22:17:01.804-05:00", file: "2026-07-05T22:17:01.804-05:00.webp",
    tags: ["poetry","kindness","Naomi Shihab Nye","1952","poem","literature","poetic imagery","emotional depth","sorrow","desolate landscape"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-05T00:00:01.996-05:00", file: "2026-07-05T00:00:01.996-05:00.png",
    tags: ["twitter post","student loan","college degree","business expense","ceo","private jet","yacht","social media","tweet","financial inequality"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-04T13:36:56.890-05:00", file: "2026-07-04T13:36:56.890-05:00.png",
    desc: "The Bible Visualized", link: "https://git.marcuschiu.com/bible-graph/", tags: ["network visualization","biblical references","data mapping","interactive dashboard","knowledge garden","graph theory","node connections","color-coded nodes","digital art","information architecture"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-07-03T02:31:07.032-05:00",
    quote: "instead of writing code, we end up writing prompts" },

  { type: "image", date: "2026-07-02T19:20:54.108-05:00", file: "2026-07-02T19:20:54.108-05:00.jpg",
    desc: "First page of the Treaty of Paris in 1783, which forced Britain to recognize the United States as a country \"In the name of the most holy and undivided Trinity\"", tags: ["historical document","handwritten text","religious text","trinity reference","legal document","old paper","duplicate","scripture reference","antique manuscript","18th century"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-07-02T04:35:51.826-05:00", file: "2026-07-02T04:35:51.826-05:00.jpg",
    tags: ["chef Gordon Ramsay","kitchen scene","LinkedIn","comparison","reality vs LinkedIn","yelling","team standards","uncompromising excellence","chef uniform","professional demeanor"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-07-01T14:34:50.961-05:00",
    quote: "cain killed his brother because he was able.... lol", desc: "his brother's name was Able" },

  { type: "image", date: "2026-06-30T17:00:14.964-05:00", file: "2026-06-30T17:00:14.964-05:00.webp",
    tags: ["monopoly board game","income generation","financial behavior","economic critique","social commentary","game strategy","wealth inequality","capitalism critique","lifestyle critique","monopoly rules"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-06-30T01:22:24.475-05:00",
    quote: "Trying to find the one big answer to the problem of living, is like trying to eat one big meal so you never have to worry about being hungry again.", author: "Harold Kushner" },

  { type: "image", date: "2026-06-29T19:35:08.286-05:00", file: "2026-06-29T19:35:08.286-05:00.webp",
    tags: ["subway interior","woman with headscarf","text overlay","train delay","passenger seating","advertisement poster","lukewarm coffee","slow driver","dreams rotting","wrong direction"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-06-28T20:06:03.203-05:00",
    quote: "sometimes strangers are friends who haven't met yet", desc: "every friend was once a stranger" },

  { type: "image", date: "2026-06-28T19:39:13.984-05:00", file: "2026-06-28T19:39:13.984-05:00.png",
    desc: "Stardust Knowledge Garden", link: "https://git.marcuschiu.com/var-log/", tags: ["knowledge garden","computer network visualization","node graph","wiki page","stanford classes","subpages","artificial intelligence","computer architecture","data science","software development"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-27T01:19:36.233-05:00", file: "2026-06-27T01:19:36.233-05:00.webp",
    tags: ["health habits","wellness practices","self care","mindful living","positive lifestyle","natural remedies","emotional health","physical health","mind body connection","healthy living"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-27T01:16:13.502-05:00", file: "2026-06-27T01:16:13.502-05:00.webp",
    tags: ["quote","life philosophy","courage","text image","inspirational text"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-25T12:45:10.334-05:00", file: "2026-06-25T12:45:10.334-05:00.webp",
    tags: ["Marriage Advice","1886","Jane Wells","compromise","friendship","book page","historical text","family values","children","text excerpt"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-25T12:36:58.060-05:00", file: "2026-06-25T12:36:58.060-05:00.jpeg",
    tags: ["book stack","stacked books","bookshelf","reading material","non-fiction books","book collection","book titles","literary works","educational books","book display"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-25T12:35:55.413-05:00", file: "2026-06-25T12:35:55.413-05:00.webp",
    tags: ["Kafka","Dostoevsky","comparison","literary","loneliness","text","portrait","black background","text overlay","contrast"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-25T12:31:52.827-05:00", file: "2026-06-25T12:31:52.827-05:00.jpg",
    tags: ["mountains","clouds","water","monochrome","landscape","nature","sky","horizon","dramatic","silhouette"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-24T18:00:46.900-05:00", file: "2026-06-24T18:00:46.900-05:00.png",
    tags: ["poetry book cover","minimalist design","woman sitting","window with curtains","soft lighting","text overlay","black and white photography","book title 'to be seen'","author name 'BRIANORA'","poems theme"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-24T18:00:23.779-05:00", file: "2026-06-24T18:00:23.779-05:00.jpeg",
    desc: "NOT AI", tags: ["blue rooster sculpture","outdoor sculpture","public art","stone building background","sunny day","shadow","large bird statue","art installation","modern art","urban environment"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-23T20:33:46.412-05:00", file: "2026-06-23T20:33:46.412-05:00.webp",
    tags: ["illusion","platonic","romantic","free choice","cow","text labels","relationship concepts","visual metaphor","color-coded sections","choice illusion"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-23T20:33:21.966-05:00", file: "2026-06-23T20:33:21.966-05:00.webp",
    tags: ["Instagram post","handwritten text","quote","social media","saved content","relationship","memories","core memories","random hangouts","people"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-23T20:21:41.905-05:00", file: "2026-06-23T20:21:41.905-05:00.jpeg",
    link: "https://git.marcuschiu.com/thoughts/article.html#2026-06-23--What-is-Beauty%3F", tags: ["watercolor","iris flowers","text overlay","abstract background","artistic illustration","beauty theme","golden frame","purple irises","floral design","cursive typography"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-23T01:13:04.088-05:00", file: "2026-06-23T01:13:04.088-05:00.jpeg",
    desc: "HK street market", tags: ["street market","t-shirts","souvenirs","urban alley","hong kong","shopping","banners","bags","tents","buildings"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-22T12:25:10.643-05:00", file: "2026-06-22T12:25:10.643-05:00.webp",
    tags: ["tiramisu","dessert","layered cake","watercolor","food illustration","cocoa powder","mascarpone","sugar dusting","square shape","text overlay"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-22T12:24:38.329-05:00", file: "2026-06-22T12:24:38.329-05:00.webp",
    desc: "\"You are the average of the five people you spend the most time with\" is only true before the internet. Now it's the average of the content you expose your mind to.", tags: ["text","quote","self-improvement","personal development","mindset","content consumption","influence","growth","inspiration","life advice"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-22T12:23:20.805-05:00", file: "2026-06-22T12:23:20.805-05:00.webp",
    tags: ["quote","text","underlined_text","English_language","inspirational_phrase","personal_growth","relationship","unexplored_self","typography","quote_image"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-22T12:22:48.361-05:00", file: "2026-06-22T12:22:48.361-05:00.webp",
    tags: ["bad dream","meme","text bubble","woman","man","sleeping","phone","night","cartoon","sarcasm"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-22T12:22:27.344-05:00", file: "2026-06-22T12:22:27.344-05:00.webp",
    tags: ["text","humor","pickup line","solipsism","conversation","friendship","philosophy","imagination","speechless","text message"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-19T21:09:14.038-05:00", file: "2026-06-19T21:09:14.038-05:00.jpeg",
    tags: ["Pokémon socks","Charmander","Pikachu","car interior","socks","anime","fashion socks","gray sock","orange sock","lunchbox design"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-19T21:09:06.112-05:00", file: "2026-06-19T21:09:06.112-05:00.jpeg",
    tags: ["Pokémon","Kung Fu Tea","Happy Holidays","red fabric","green Pokémon character","car interior","ESRB rating","plastic cup","Nintendo Switch","collectible item"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-19T21:08:55.857-05:00", file: "2026-06-19T21:08:55.857-05:00.jpeg",
    tags: ["cafe","branded interior","brick wall","kung fu tea","tables and chairs","digital menu boards","red ceiling","yogurt series poster","chess board","gaming board"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-19T14:19:37.649-05:00", file: "2026-06-19T14:19:37.649-05:00.webp",
    desc: "dog at home", tags: ["gas station","dog","sleeping","blanket","pillow","Shell","OSÓRIOS","#MB","fuel pump","pet"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-17T23:24:14.513-05:00", file: "2026-06-17T23:24:14.513-05:00.webp",
    tags: ["medieval knight","armor","cell phone","text message","prophecy","betrayal","dark sky","purple clouds","meme","digital communication"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-17T23:23:20.885-05:00", file: "2026-06-17T23:23:20.885-05:00.webp",
    tags: ["painting","couple","kissing","abstract","dark tones","indoor setting","blue tones","art","emotion","intimacy"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-06-16T21:28:52.418-05:00",
    quote: "When you copy from one source it's plagiarism. But when you copy from multiple sources it's research." },

  { type: "image", date: "2026-06-16T21:26:38.696-05:00", file: "2026-06-16T21:26:38.696-05:00.jpg",
    tags: ["modern architecture","conical structure","reflective surface","blue sky","clouds","urban landmark","metallic material","tall building","abstract design","geometric pattern"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-14T13:11:25.558-05:00", file: "2026-06-14T13:11:25.558-05:00.jpg",
    tags: ["night sky","stars","aurora","mountains","lake","city lights","clouds","sunset","landscape","celestial phenomenon"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-06-14T11:27:18.628-05:00",
    quote: "The question in love isn't whether I want this person, but more of whether you want to know this person" },

  { type: "image", date: "2026-06-13T22:22:05.436-05:00", file: "2026-06-13T22:22:05.436-05:00.webp",
    tags: ["advertising billboard","Claude","Keep thinking","man sitting","subway station","brown background","digital display","text overlay","thoughtful pose","modern interior"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-06-12T13:36:05.937-05:00",
    quote: "The most intelligent men, like the strongest, find their happiness where others would find only disaster: in the labyrinth, in being hard with themselves and with others, in effort; their delight is in self-mastery; in them asceticism becomes second nature, a necessity, an instinct. They regard a difficult task as a privilege; it is to them a recreation to play with burdens that would crush all others.", desc: "a view under the sun" },

  { type: "audio", date: "2026-06-12T13:22:07.684-05:00", file: "2026-06-12T13:22:07.684-05:00.mp3",
    title: "Charli XCX - Forever", link: "https://www.youtube.com/watch?v=TbJE-KVZvTA", poster: "2026-06-12T13:22:07.684-05:00-poster.jpeg", tags: ["love","suicide","car","dive","blue","feelings","grow","ghost","forever","december"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T13:18:24.248-05:00", file: "2026-06-12T13:18:24.248-05:00.webp",
    tags: ["couple","illustration","watering can","roses","monstera plant","couch","sad expression","head plants","domestic scene","artwork"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "audio", date: "2026-06-12T13:00:36.453-05:00", file: "2026-06-12T13:00:36.453-05:00.mp3",
    title: "Merry Christmas Mr. Lawrence", poster: "2026-06-12T13:00:36.453-05:00-poster.png", tags: ["piano","musician","studio","microphone","sheet music","black and white","lighting","glasses","blonde hair","silhouette"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:56:01.329-05:00", file: "2026-06-12T12:56:01.329-05:00.webp",
    tags: ["love advice","relationship tips","how to stay in love","curiosity in relationships","healthy boundaries","communication in love","emotional connection","romantic relationship","interdependence","codependence"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "audio", date: "2026-06-12T12:54:34.201-05:00", file: "2026-06-12T12:54:34.201-05:00.mp3",
    title: "Let It Be (Guitar)", poster: "2026-06-12T12:54:34.201-05:00-poster.jpeg", tags: ["The Beatles","Let It Be album cover","four-panel collage","John Lennon","Paul McCartney","George Harrison","Ringo Starr","microphone","1960s music","album artwork"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:50:35.247-05:00", file: "2026-06-12T12:50:35.247-05:00.webp",
    tags: ["street scene","window","guitar","waiting","building","tree","text overlay","woman","man","urban"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "quote", date: "2026-06-12T12:49:38.279-05:00",
    quote: "Dead people receive more flowers than living ones, because regret is stronger than gratitude" },

  { type: "image", date: "2026-06-12T12:47:46.635-05:00", file: "2026-06-12T12:47:46.635-05:00.webp",
    tags: ["teddy bear","stuffed animals","warehouse","dark lighting","text overlay","white teddy bear","toys","fuzzy texture","arrangement","store"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:46:37.578-05:00", file: "2026-06-12T12:46:37.578-05:00.webp",
    desc: "1 year to a 10 year old is 10 percent of his life, but to a 100 year old it's 1 percent", tags: ["time perception","age progression","life stages","timeline","childhood","early adulthood","senior years","visual representation","conceptual diagram","bar chart"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "audio", date: "2026-06-12T12:44:24.297-05:00", file: "2026-06-12T12:44:24.297-05:00.mp3",
    title: "Elijah Who - Hello", poster: "2026-06-12T12:44:24.297-05:00-poster.png", tags: ["greeting","introduction","name exchange","polite conversation","small talk","social interaction","thank you","repetition","confusion","disbelief"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:43:20.600-05:00", file: "2026-06-12T12:43:20.600-05:00.webp",
    tags: ["Anime","Forest","Character","Dog","Weapon","Native American attire","Night scene","Foliage","Fur","Earring"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:43:10.942-05:00", file: "2026-06-12T12:43:10.942-05:00.webp",
    tags: ["Revenge bedtime procrastination","psychological phenomenon","sleep behavior","procrastination","control over time","nighttime habits","self-regulation","sleep deprivation","behavioral psychology","sleep schedule"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:43:02.204-05:00", file: "2026-06-12T12:43:02.204-05:00.webp",
    tags: ["woman combing hair","mirror","desk lamp","long hair","hand holding comb","bedroom setting","text overlay","self-care","reflection","beauty routine"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:42:51.357-05:00", file: "2026-06-12T12:42:51.357-05:00.webp",
    tags: ["monochrome","staircase","silhouette","architecture","light and shadow","abstract","minimalist","human figure","geometric","concrete"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:41:10.547-05:00", file: "2026-06-12T12:41:10.547-05:00.webp",
    tags: ["dog","dachshund","sunlight","floor","kitchen","refrigerator","wooden floor","mat","relaxing","sunbeam"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:40:57.455-05:00", file: "2026-06-12T12:40:57.455-05:00.webp",
    tags: ["text message conversation","gym invitation","baby born","10 years friendship","2 days","retarded insult","dayum","i cant bro","remember","man i think youre really retarded"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T12:39:21.368-05:00", file: "2026-06-12T12:39:21.368-05:00.webp",
    tags: ["man","computer equipment","monitor","electronics","audio mixer","circuitry","wires","blue screen","shack","technical setup"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-12T03:19:29.244-05:00", file: "2026-06-12T03:19:29.244-05:00.jpg",
    desc: "Downtown Dallas - circa 2017", tags: ["abandoned building","urban decay","water puddle","concrete sidewalk","large industrial building","broken windows","sunlit facade","dilapidated structure","exposed wiring","empty lot"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "image", date: "2026-06-12T02:59:24.886-05:00", file: "2026-06-12T02:59:24.886-05:00.png",
    tags: ["Museum of Contemporary Art","Architectural landmark","Sail-shaped structures","Public plaza","Urban landscape","People walking","Overcast sky","Modern architecture","Cultural institution","Stone pavement"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "audio", date: "2026-06-12T01:51:43.644-05:00", file: "2026-06-12T01:51:43.644-05:00.m4a",
    title: "Our God is an Awesome God", link: "https://www.youtube.com/watch?v=PP9BjKnDaFk", poster: "2026-06-12T01:51:43.644-05:00-poster.jpg", tags: ["lyrics","composition","Lee","Zongsheng","song","music","artist","repeated","repetition","repeatedly"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "audio", date: "2026-06-12T01:05:39.046-05:00", file: "2026-06-12T01:05:39.046-05:00.mp4",
    title: "Darling I Do (Wedding Vows)", desc: "vows are not a list of reasons why you love someone, they are a list of promises you make for someone", poster: "2026-06-12T01:05:39.046-05:00-poster.jpg", tags: ["wedding vows","marriage promise","faithful friend","lover pursuit","repetition of yes","for better or worse","for richer for poorer","in sickness and in hell","till death do you part","love each other"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-11T19:23:01.691-05:00", file: "2026-06-11T19:23:01.691-05:00.webp",
    link: "https://maps.app.goo.gl/BV7zCbLry34rvqmB7", tags: ["interior architecture","grand lobby","wooden ceiling","modern sculpture","indoor garden","seating area","patterned flooring","multi-level structure","luxury hotel","vertical garden"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-11T19:21:28.740-05:00", file: "2026-06-11T19:21:28.740-05:00.jpg",
    tags: ["book cover","Alain de Botton","Essays in Love","Picador","Macmillan London","title page","paper","aged paper","water stain","text"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "youtube", date: "2026-06-10T16:15:34.054-05:00", id: "uzDKm990MvQ",
    desc: "praise is the overflow of what you enjoy" },

  { type: "video", date: "2026-06-10T10:01:07.122-05:00", file: "2026-06-10T10:01:07.122-05:00.mov",
    desc: "Zhuhai Grand Theater", link: "https://share.google/wVzluW3nDm4GxOoLl", poster: "2026-06-10T10:01:07.122-05:00-poster.jpg", tags: ["Luzhou Grand Theater","modern architecture","spherical structures","public plaza","tourists","stone pavement","cloudy sky","landscaped trees","large building","outdoor gathering"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "image", date: "2026-06-10T01:01:17.463-05:00", file: "2026-06-10T01:01:17.463-05:00.png",
    link: "http://git.marcuschiu.com/var-log/enter-visual/art/draw-random-girl/", tags: ["short hair","blue tone","tear","side profile","dark hair","moody lighting","human face","soft focus","monochrome","subtle expression"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "image", date: "2026-06-09T23:51:28.050-05:00", file: "2026-06-09T23:51:28.050-05:00.webp",
    tags: ["anime","penguin character","female character","grocery store","text overlay","romantic misunderstanding","manga style","store aisle","cartoon","visual novel"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-09T20:38:35.308-05:00", file: "2026-06-09T20:38:35.308-05:00.webp",
    desc: "the most personal is the most creative", link: "https://archive.org/details/MereChristianityCSL/page/n125/mode/2up#:~:text=you%20will%20never,find%20eternal%20life.", tags: ["text excerpt","philosophical quote","literature","art","truth","originality","self-discovery","submission","eternal life","life principles"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-09T20:33:23.754-05:00", file: "2026-06-09T20:33:23.754-05:00.webp",
    tags: ["text","quote","life advice","boring lifestyle","peaceful living","routine","family time","work ethic","simple diet","walking"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-09T20:32:55.494-05:00", file: "2026-06-09T20:32:55.494-05:00.webp",
    tags: ["cartoon bears","eating together","text overlay","white bear","brown bear","food","animation","character design","simple background","meme"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-09T20:32:02.725-05:00", file: "2026-06-09T20:32:02.725-05:00.webp",
    tags: ["social media post","text-based meme","italics demonstration","TIL","text formatting","word emphasis","miscommunication","repetition","digital communication","internet humor"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-09T20:31:43.242-05:00", file: "2026-06-09T20:31:43.242-05:00.webp",
    link: "https://maps.app.goo.gl/BV7zCbLry34rvqmB7", tags: ["hotel lobby","modern interior","art installation","large sculpture","ceiling design","indoor seating","bar area","metal structure","lighting fixtures","high ceiling"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-09T13:11:17.983-05:00", file: "2026-06-09T13:11:17.983-05:00.jpeg",
    tags: ["night scene","beach","moon","stars","umbrella","deck chair","table","lamp","radio","book"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-09T13:08:58.278-05:00", file: "2026-06-09T13:08:58.278-05:00.png",
    tags: ["quote","poetry","Mary Oliver","Upstream","self-discovery","youth","stranger to self","existence","world exploration","literature"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-09T13:08:40.695-05:00", file: "2026-06-09T13:08:40.695-05:00.jpeg",
    tags: ["handwritten text","quote","growth","peace","dark background","blue text","inspirational","motivational","text on dark surface","cursive writing"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-09T13:03:52.793-05:00", file: "2026-06-09T13:03:52.793-05:00.webp",
    tags: ["red fox","sleeping","couch","text overlay","relaxation","animal","warm lighting","comfort","paw","text"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-08T23:25:28.249-05:00", file: "2026-06-08T23:25:28.249-05:00.jpg",
    tags: ["P Winnie the Pooh","cherry blossom tree","honey pot","text quote","watercolor style","sitting bear","nature scene","positive message","spring setting","illustration"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "image", date: "2026-06-08T23:25:21.316-05:00", file: "2026-06-08T23:25:21.316-05:00.webp",
    tags: ["bloodied cat","cartoon","text overlay","recovery","injured","red and blue","dripping blood","lying down","meme","sad"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "image", date: "2026-06-08T23:21:10.009-05:00", file: "2026-06-08T23:21:10.009-05:00.webp",
    tags: ["truth","lie","questioning","challenging","text-based","quote","philosophy","moral","comparison","text"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "image", date: "2026-06-08T23:13:59.023-05:00", file: "2026-06-08T23:13:59.023-05:00.jpg",
    tags: ["child","teddy bear","wooden fence","nature","illustration","text overlay","memory","fun","cartoon","outdoor"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-08T23:11:03.873-05:00", file: "2026-06-08T23:11:03.873-05:00.webp",
    tags: ["cat paw","oreo cookie","white fur","hand holding","striped cat","cat toy","cute animal","food mimicry","pet accessory","Oreo cat paw"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "youtube", date: "2026-06-08T23:01:12.757-05:00", id: "PP9BjKnDaFk",
    hidden: true },

  { type: "video", date: "2026-06-08T22:59:41.513-05:00", file: "2026-06-08T22:59:41.513-05:00.mov",
    desc: "jellyfish", poster: "2026-06-08T22:59:41.513-05:00-poster.jpg", tags: ["jellyfish","marine life","aquatic animal","blue background","translucent body","striped bell","long tentacles","bioluminescent","underwater","soft coral"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "image", date: "2026-06-08T19:58:33.441-05:00", file: "2026-06-08T19:58:33.441-05:00.jpg",
    tags: ["Zoom meeting","Text message","Chat conversation","Thank you habit","You're welcome","Lol","Chuckling","Delivered timestamp","1:27 PM","K avatar"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-08T19:58:17.091-05:00", file: "2026-06-08T19:58:17.091-05:00.jpeg",
    link: "https://www.imdb.com/title/tt1913273", tags: ["handheld sketch","anime characters","pencil drawing","six-panel layout","Anohana reference","2013 date","character portraits","school uniforms","glasses character","tied hair"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-08T19:57:48.626-05:00", file: "2026-06-08T19:57:48.626-05:00.jpeg",
    desc: "mich star boba", link: "https://share.google/8Kedbj52NAAyVMJmW", tags: ["Taiwanese tea","bubble tea","San Chen","handheld drink","strawberry flavor","paper sleeve","twine","outdoor setting","people in background","plastic cup"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-08T19:57:20.077-05:00", file: "2026-06-08T19:57:20.077-05:00.jpeg",
    desc: "a butt", link: "https://maps.app.goo.gl/bX7CU7NCin6pseH36", tags: ["pink inflatable sculpture","stone building","yellow banner","exhibitions","urban art","large-scale art","public art","building facade","window","sky"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-08T12:03:00.000-05:00", file: "2026-06-08T12:03:00.000-05:00.webp",
    tags: ["poetry","emotional text","relationship","heartbreak","lyrics","text-based art","intimate feelings","unrequited love","despair","hopelessness"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-08T12:02:00.000-05:00", file: "2026-06-08T12:02:00.000-05:00.webp",
    desc: "Geodude Hanger", link: "https://www.etsy.com/market/geodude_hanger", tags: ["Pokémon","Muk","3D print","handheld","watch","purple helmet","gray background"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-08T12:01:00.000-05:00", file: "2026-06-08T12:01:00.000-05:00.webp",
    link: "https://maps.app.goo.gl/BV7zCbLry34rvqmB7", tags: ["interior architecture","vertical garden","lobby","elevators","art installation","multi-level building","indoor plants","modern design","staircase","lighting fixtures"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-08T12:00:00.000-05:00", file: "2026-06-08T12:00:00.000-05:00.webp",
    tags: ["poetry","love","relationship","intimacy","romance","text","social media","quote","emotional connection","quiet moments"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },
];
