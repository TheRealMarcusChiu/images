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
  { type: "image", date: "2026-06-24T18:00:46.900-05:00", file: "2026-06-24T18:00:46.900-05:00.png",
    tags: ["poetry book cover","minimalist design","woman sitting","window with curtains","soft lighting","text overlay","black and white photography","book title 'to be seen'","author name 'BRIANORA'","poems theme"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

  { type: "image", date: "2026-06-24T18:00:23.779-05:00", file: "2026-06-24T18:00:23.779-05:00.jpeg",
    tags: ["blue rooster sculpture","outdoor sculpture","public art","stone building background","sunny day","shadow","large bird statue","art installation","modern art","urban environment"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

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
    tags: ["gas station","dog","sleeping","blanket","pillow","Shell","OSÓRIOS","#MB","fuel pump","pet"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

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
    title: "Charli XCX - Forever", link: "https://www.youtube.com/watch?v=TbJE-KVZvTA", poster: "2026-06-12T13:22:07.684-05:00-poster.jpeg", tags: ["Charli XCX","album cover","bedroom scene","woman lying down","mirror reflection","text overlay","red text","artistic illustration","forever","sleeping"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

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
    title: "Elijah Who - Hello", poster: "2026-06-12T12:44:24.297-05:00-poster.png", tags: ["night scene","anime","two people","cityscape","bicycle","street lamp","stars","urban setting","silhouette","back view"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

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
    title: "Our God is an Awesome God", link: "https://www.youtube.com/watch?v=PP9BjKnDaFk", poster: "2026-06-12T01:51:43.644-05:00-poster.jpg", tags: ["stars","space","cosmic background","nebula","galaxy","astronomy","deep space","stellar field","night sky","celestial objects"], tagProvider: "ollama", tagModel: "qwen3-vl:8b", hidden: true },

  { type: "audio", date: "2026-06-12T01:05:39.046-05:00", file: "2026-06-12T01:05:39.046-05:00.mp4",
    title: "Darling I Do (Wedding Vows)", desc: "vows are not a list of reasons why you love someone, they are a list of promises you make for someone", poster: "2026-06-12T01:05:39.046-05:00-poster.jpg", tags: ["wedding venue","mountain backdrop","white chairs","flower arrangements","ceremonial arch","text overlay","outdoor ceremony","sunset lighting","landscape photography","event planning"], tagProvider: "ollama", tagModel: "qwen3-vl:8b" },

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
    hidden: true },

  { type: "image", date: "2026-06-08T23:13:59.023-05:00", file: "2026-06-08T23:13:59.023-05:00.jpg" },

  { type: "image", date: "2026-06-08T23:11:03.873-05:00", file: "2026-06-08T23:11:03.873-05:00.webp" },

  { type: "youtube", date: "2026-06-08T23:01:12.757-05:00", id: "PP9BjKnDaFk",
    hidden: true },

  { type: "video", date: "2026-06-08T22:59:41.513-05:00", file: "2026-06-08T22:59:41.513-05:00.mov",
    desc: "jellyfish", poster: "2026-06-08T22:59:41.513-05:00-poster.jpg", hidden: true },

  { type: "image", date: "2026-06-08T19:58:33.441-05:00", file: "2026-06-08T19:58:33.441-05:00.jpg" },

  { type: "image", date: "2026-06-08T19:58:17.091-05:00", file: "2026-06-08T19:58:17.091-05:00.jpeg",
    link: "https://www.imdb.com/title/tt1913273" },

  { type: "image", date: "2026-06-08T19:57:48.626-05:00", file: "2026-06-08T19:57:48.626-05:00.jpeg",
    desc: "mich star boba", link: "https://share.google/8Kedbj52NAAyVMJmW" },

  { type: "image", date: "2026-06-08T19:57:20.077-05:00", file: "2026-06-08T19:57:20.077-05:00.jpeg",
    desc: "a butt", link: "https://maps.app.goo.gl/bX7CU7NCin6pseH36" },

  { type: "image", date: "2026-06-08T12:03:00.000-05:00", file: "2026-06-08T12:03:00.000-05:00.webp" },

  { type: "image", date: "2026-06-08T12:02:00.000-05:00", file: "2026-06-08T12:02:00.000-05:00.webp",
    desc: "Geodude Hanger", link: "https://www.etsy.com/market/geodude_hanger" },

  { type: "image", date: "2026-06-08T12:01:00.000-05:00", file: "2026-06-08T12:01:00.000-05:00.webp",
    link: "https://maps.app.goo.gl/BV7zCbLry34rvqmB7" },

  { type: "image", date: "2026-06-08T12:00:00.000-05:00", file: "2026-06-08T12:00:00.000-05:00.webp" },
];
