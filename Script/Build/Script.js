"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class Cube extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static { this.iSubclass = ƒ.Component.registerSubclass(Cube); }
        static { this.indentity = ƒ.Matrix4x4.IDENTITY(); }
        static { this.rotate = {
            left: [1, 2, 3, 0, 4, 5],
            right: [3, 0, 1, 2, 4, 5],
            up: [4, 1, 5, 3, 2, 0],
            down: [5, 1, 4, 3, 0, 2]
        }; }
        constructor() {
            super();
            this.mtxCurrent = new ƒ.Matrix4x4();
            this.textures = [];
            this.free = true;
            // Activate the functions of this component as response to events
            this.hndEvent = (_event) => {
                switch (_event.type) {
                    case "componentAdd" /* ƒ.EVENT.COMPONENT_ADD */:
                        this.node.addEventListener("pointerdown", this.hndPointerEvent);
                        this.node.addEventListener("pointermove", this.hndPointerEvent);
                        this.node.addEventListener("pointerup", this.hndPointerEvent);
                        this.node.addEventListener("reset", this.reset, true);
                        break;
                    case "componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */:
                        this.removeEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
                        this.removeEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                        break;
                    case "nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */:
                        // this.node.addEventListener(ƒ.EVENT.CHILD_APPEND, (_event: Event) => {
                        this.cube = this.node.getParent();
                        if (this.cube)
                            this.mtxCurrent.copy(this.cube.mtxLocal.clone);
                        // });
                        break;
                }
            };
            this.hndPointerEvent = (_event) => {
                if (!this.free)
                    return;
                switch (_event.type) {
                    case "pointerdown":
                        this.start = new ƒ.Vector2(_event.offsetX, _event.offsetY);
                        this.mtxCurrent.copy(this.cube.mtxLocal.clone);
                        break;
                    case "pointermove":
                        if (!this.start)
                            return;
                        const move = this.calcMove(_event);
                        this.cube.mtxLocal.copy(this.mtxCurrent);
                        this.rotate(this.cube, move);
                        ƒ.Recycler.store(move);
                        break;
                    case "pointerup":
                        this.reset(_event);
                        break;
                }
            };
            this.reset = (_event) => {
                if (!this.start)
                    return;
                const move = this.calcMove(_event instanceof PointerEvent ? _event : _event.detail);
                this.start = null;
                ƒ.DebugTextArea.textArea.style.backgroundColor = "green";
                if (move.magnitude > 9.9) {
                    this.free = false;
                    ƒ.DebugTextArea.textArea.style.backgroundColor = "red";
                    const step = 6;
                    if (Math.abs(move.x) > Math.abs(move.y))
                        move.set(move.x = move.x < 0 ? -step : step, 0);
                    else
                        move.set(0, move.y = move.y < 0 ? -step : step);
                    ƒ.Time.game.setTimer(30, 90 / step, (_event) => {
                        this.rotate(this.node, move);
                        if (_event.lastCall) {
                            this.cube.mtxLocal.copy(this.mtxCurrent);
                            this.node.mtxLocal.copy(Cube.indentity);
                            this.rotateTextures(move);
                            this.free = true;
                            this.node.dispatchEvent(new Event("check", { bubbles: true }));
                        }
                    });
                    return;
                }
                this.cube.mtxLocal.copy(this.mtxCurrent);
            };
            this.calcMove = (_event) => {
                let move = ƒ.Recycler.get(ƒ.Vector2);
                move.set(_event.offsetX - this.start.x, this.start.y - _event.offsetY);
                let mag = move.magnitude;
                if (mag > 10)
                    move.normalize(10);
                return move;
            };
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
        async setTextures(_content, _correct) {
            for (let i = 0; i < 6; i++) {
                const side = this.node.getChild(i);
                let texture;
                if (_content[i] instanceof Request) {
                    texture = new ƒ.TextureImage();
                    await (texture.load)(Reflect.get(_content[i], "url"));
                }
                else
                    texture = await this.createTexture(_content[i].toString());
                const material = new ƒ.Material(i.toString(), ƒ.ShaderFlatTextured);
                material.coat.texture = texture;
                side.removeComponent(side.getComponent(ƒ.ComponentMaterial));
                side.addComponent(new ƒ.ComponentMaterial(material));
                this.textures.push(texture);
                if (i == _correct)
                    this.correct = texture;
            }
        }
        check() {
            return (this.textures[0] == this.correct);
        }
        resetTextures() {
            for (let i = 0; i < 6; i++) {
                const side = this.node.getChild(i);
                side.getComponent(ƒ.ComponentMaterial).material.coat.texture = this.textures[i];
            }
        }
        async createTexture(_text) {
            const size = 300;
            const canvas = new OffscreenCanvas(size, size);
            const crc2 = canvas.getContext("2d");
            const texture = new ƒ.TextureCanvas("canvas", crc2);
            crc2.fillStyle = "white";
            crc2.fillRect(0, 0, canvas.width, canvas.height);
            crc2.fillStyle = "black";
            crc2.strokeStyle = "black";
            crc2.font = "50px serif";
            let text = document.createElement("span");
            // text.innerHTML = "eins zwei drei vier fünf sechs sieben acht";
            text.innerHTML = "<h1 style='font-size:3em; text-align:center'>" + _text + "</h1>";
            await drawHtmlDom(text, 0, 0, canvas.width, canvas.height);
            async function drawHtmlDom(_html, _x, _y, _width, _height) {
                var d = "data:image/svg+xml,";
                d += "<svg xmlns='http://www.w3.org/2000/svg' width='" + _width + "' height='" + _height + "' >";
                d += "<foreignObject width='100%' height ='100%'>";
                d += "<div xmlns='http://www.w3.org/1999/xhtml'>";
                d += _html.outerHTML;
                d += "</div></foreignObject></svg>";
                return new Promise((_resolve, _reject) => {
                    var img = new Image();
                    img.src = d;
                    img.onload = () => {
                        crc2.drawImage(img, _x, _y);
                        _resolve();
                    };
                });
            }
            return texture;
        }
        rotate(_node, _move) {
            _node.mtxLocal.rotateX(_move.y, true);
            _node.mtxLocal.rotateY(_move.x);
        }
        rotateTextures(_move) {
            let direction = "left";
            if (_move.x > 0)
                direction = "right";
            else if (_move.y < 0)
                direction = "up";
            else if (_move.y > 0)
                direction = "down";
            let rotate = Cube.rotate[direction];
            // ƒ.Debug.log(rotate);
            let textures = [];
            rotate.forEach((_index) => textures.push(this.textures[_index]));
            this.textures = textures;
            this.resetTextures();
        }
    }
    Script.Cube = Cube;
})(Script || (Script = {}));
var Script;
(function (Script) {
    Script.data = [
        { meenzer: "Babbel!", german: "Sprich! Rede!", img: new Request("./Img/Babbel.png") },
        { meenzer: "Aach", german: "Auge", img: new Request("./Img/Auge.png") },
        { meenzer: "Aachedeckel", german: "Augenlid", img: new Request("./Img/Lid.png") },
        // { meenzer: "aarisch", german: "sehr", img: new Request("./Img/Questionmark.png") },
        { meenzer: "Äbbel", german: "Äpfel", img: new Request("./Img/Apples.png") },
        { meenzer: "Abbelkrotze", german: "Kerngehäuse vom Apfel", img: new Request("./Img/Krotze.png") },
        { meenzer: "Adschee", german: "Adieu", img: new Request("./Img/Wave.png") },
        { meenzer: "ald Scheckel", german: "alte Frau", img: new Request("./Img/Alte.png") },
        { meenzer: "alleweil", german: "jetzt sofort", img: new Request("./Img/Uhr.png") },
        { meenzer: "Atzel", german: "Perücke", img: new Request("./Img/Wig.png") },
        { meenzer: "babbisch", german: "schmutzige", img: new Request("./Img/Fleck.png") },
        { meenzer: "Batschel", german: "ungeschickter Mensch", img: new Request("./Img/Clumsy.png") },
        { meenzer: "Batschkabb", german: "Schirmmütze", img: new Request("./Img/Batsch.png") },
        { meenzer: "Berzel", german: "Kopf", img: new Request("./Img/Kopf.png") },
        { meenzer: "Blummescherb", german: "Blumentopf aus Ton", img: new Request("./Img/Blumentopf.png") },
        { meenzer: "Blunz", german: "Blutwurst", img: new Request("./Img/Blutwurst.png") },
        { meenzer: "Bobbelche", german: "Säugling", img: new Request("./Img/Baby.png") },
        { meenzer: "Bobbes", german: "Gesäß", img: new Request("./Img/Po.png") },
        { meenzer: "Bollesje", german: "Gefängnis", img: new Request("./Img/Knast.png") },
        { meenzer: "Borzel", german: "kleines Kind", img: new Request("./Img/Kind.png") },
        { meenzer: "bossele", german: "basteln", img: new Request("./Img/Basteln.png") },
        { meenzer: "Brockelscher", german: "Rosenkohl", img: new Request("./Img/Kohl.png") },
        { meenzer: "Butze", german: "Polizist", img: new Request("./Img/Polizist.png") },
        { meenzer: "Butzebebel", german: "Nasenpopel", img: new Request("./Img/Popel.png") },
        { meenzer: "Dibbsche", german: "kleiner Topf", img: new Request("./Img/Dibbsche.png") },
        { meenzer: "Dibbe", german: "Topf", img: new Request("./Img/Dibbe.png") },
        { meenzer: "dick Blunz", german: "Schimpfwort für eine dicke Frau", img: new Request("./Img/Dick.png") },
        { meenzer: "Dierschlink", german: "Türklinke", img: new Request("./Img/Klinke.png") },
        { meenzer: "Dorscht", german: "Durst", img: new Request("./Img/Durst.png") },
        { meenzer: "Dubbee", german: "Toupet", img: new Request("./Img/Toupet.png") },
        { meenzer: "Dutt", german: "Tüte", img: new Request("./Img/Bag.png") },
        { meenzer: "Geil", german: "Pferde", img: new Request("./Img/Pferde.png") },
        { meenzer: "Geilskniddel", german: "Pferdeapfel", img: new Request("./Img/Pferdekot.png") },
        { meenzer: "Gemies", german: "Gemüse", img: new Request("./Img/Veggi.png") },
        { meenzer: "gemoschderd", german: "unmögliche Kleiderkombination", img: new Request("./Img/Klamotte.png") },
        { meenzer: "Gutzje", german: "Bonbon", img: new Request("./Img/Bonbon.png") },
        { meenzer: "Haggele", german: "Kiefer- oder Tannenzapfen", img: new Request("./Img/Zapfen.png") },
        { meenzer: "Haggesjer", german: "Milchzähne", img: new Request("./Img/Teeth.png") },
        { meenzer: "Herrgottsdierche", german: "Marienkäfer", img: new Request("./Img/Bug.png") },
        { meenzer: "ibberhibbelt", german: "übersprungen oder übergangen", img: new Request("./Img/Jump.png") },
        { meenzer: "Kabb", german: "Mütze", img: new Request("./Img/Cap.png") },
        { meenzer: "Kabottche", german: "unmoderner Hut", img: new Request("./Img/Hat.png") },
        { meenzer: "Katzuff", german: "Metzger", img: new Request("./Img/Metzger.png") },
        { meenzer: "Kerb", german: "Kirchweihfest", img: new Request("./Img/Kerb.png") },
        { meenzer: "Kerch", german: "Kirche", img: new Request("./Img/Kirche.png") },
        // { meenzer: "Kimmche", german: "große Tasse", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Kinnerschees", german: "Kinderwagen", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Knadscher", german: "Bäcker", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Knerzje", german: "Endstück vom Brot oder Braten", img: new Request("./Img/Questionmark.png") },
        { meenzer: "Kniddel", german: "Tierkot", img: new Request("./Img/Kot.png") },
        { meenzer: "Knolle", german: "polizeiliche Geldstrafe", img: new Request("./Img/Ticket.png") },
        { meenzer: "Kobberd", german: "Kopfsprung", img: new Request("./Img/Kopfsprung.png") },
        { meenzer: "Krebbel", german: "Berliner bzw. Krapfen", img: new Request("./Img/Krebbel.png") },
        { meenzer: "Krimmele", german: "Krümel", img: new Request("./Img/Crumbs.png") },
        { meenzer: "Lomberie", german: "Bodenabschlussleiste an der Wand", img: new Request("./Img/Leiste.png") },
        { meenzer: "Lattwerch", german: "steif gekochtes Zwetschgenmus", img: new Request("./Img/Lattwerch.png") },
        { meenzer: "Liehbeidel", german: "Lügner", img: new Request("./Img/Lier.png") },
        { meenzer: "machulle", german: "bankrott", img: new Request("./Img/Poor.png") },
        { meenzer: "Meggeldasch", german: "Einkaufstasche", img: new Request("./Img/Bag.png") },
        { meenzer: "Mick", german: "Mücke", img: new Request("./Img/Mick.png") },
        { meenzer: "Mickeblatsch", german: "Fliegenklatsche", img: new Request("./Img/Batsch.png") },
        { meenzer: "Mutsch", german: "Kosewort für Mutter", img: new Request("./Img/Mutsch.png") },
        { meenzer: "Nuddelche", german: "Schnuller", img: new Request("./Img/Schnuller.png") },
        { meenzer: "Nuddelfläschje", german: "Trinkflasche mit Sauger", img: new Request("./Img/Flasche.png") },
        { meenzer: "Oongstschisser", german: "ängstlicher Mensch", img: new Request("./Img/Schisser.png") },
        { meenzer: "Oonk", german: "Genick", img: new Request("./Img/Genick.png") },
        { meenzer: "oogeduddelt", german: "angetrunken", img: new Request("./Img/Suff.png") },
        { meenzer: "pischbern", german: "flüstern", img: new Request("./Img/Pischbern.png") },
        { meenzer: "Prottsche", german: "polizeiliche Geldstrafe", img: new Request("./Img/Ticket.png") },
        { meenzer: "Quetsche", german: "Zwetschgen bzw. Pflaumen", img: new Request("./Img/Quetsche.png") },
        { meenzer: "Rachebutzer", german: "saurer Wein", img: new Request("./Img/Wein.png") },
        { meenzer: "rack", german: "steif", img: new Request("./Img/Steif.png") },
        { meenzer: "Reitschul", german: "Kinderkarussell", img: new Request("./Img/Karussell.png") },
        { meenzer: "Ribbelkuche", german: "Streuselkuchen", img: new Request("./Img/Kuchen.png") },
        { meenzer: "Rotzfohn", german: "Taschentuch", img: new Request("./Img/Taschentuch.png") },
        { meenzer: "schebb", german: "schief und krumm", img: new Request("./Img/Schief.png") },
        { meenzer: "Schelleklobbe", german: "klingeln und dann wegrennen", img: new Request("./Img/Klingel.png") },
        { meenzer: "Schinnos", german: "Luder", img: new Request("./Img/Luder.png") },
        { meenzer: "Schlebbche", german: "Schleifchen", img: new Request("./Img/Schleife.png") },
        { meenzer: "Schlibber", german: "Holzsplitter in der Haut", img: new Request("./Img/Splitter.png") },
        { meenzer: "Schlickse", german: "Schluckauf", img: new Request("./Img/Hickup.png") },
        { meenzer: "Schlobb", german: "Schleife", img: new Request("./Img/Schleife.png") },
        { meenzer: "Schminzje", german: "zierliches Kind", img: new Request("./Img/Kind.png") },
        { meenzer: "Schmiss", german: "Schläge", img: new Request("./Img/Schlag.png") },
        // { meenzer: "schneegelisch", german: "wählerisch beim Essen", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Schnorres", german: "Schnauzbart", img: new Request("./Img/Questionmark.png") },
        { meenzer: "Schnut", german: "Mund", img: new Request("./Img/Teeth.png") },
        { meenzer: "schnuddelisch", german: "unsauber", img: new Request("./Img/Fleck.png") },
        // { meenzer: "schnuckele", german: "naschen", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Schockelgaul", german: "Schaukelpferd", img: new Request("./Img/Questionmark.png") },
        { meenzer: "Schrumbele", german: "Falten im Gesicht", img: new Request("./Img/Alte.png") },
        { meenzer: "Säckel", german: "Tasche in Kleidungsstücken", img: new Request("./Img/Poor.png") },
        // { meenzer: "Spätzje", german: "Penis", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Stiftekopp", german: "kurz geschnittene Haare", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "strunzen", german: "angeben", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Strunzer", german: "Prahler", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Stumbe", german: "Zigarre", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "vebummbeidelt", german: "verschlampt", img: new Request("./Img/Questionmark.png") },
        { meenzer: "Verdel", german: "achtel Liter Wein", img: new Request("./Img/Wein.png") },
        { meenzer: "Verdelsbutze", german: "Polizist in einem Stadtteil", img: new Request("./Img/Polizist.png") },
        // { meenzer: "veklebbern", german: "verrühren", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "veklickern", german: "genau erklären", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Wombe", german: "dicker Bauch", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Welljerholz", german: "Nudelholz", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Worscht", german: "Wurst", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Worzelberscht", german: "Wurzelbürste", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Wutz", german: "Schwein", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Wutzebeehle", german: "schlampige Frau", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Zibbelsche", german: "Endstück der Wurst", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "zobbele", german: "zupfen", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Zores", german: "Gesindel", img: new Request("./Img/Questionmark.png") },
        // { meenzer: "Zwerndobbsch", german: "kleines lebhaftes Kind", img: new Request("./Img/Questionmark.png") }
    ];
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Debug.info("Main Program Template running!");
    let viewport;
    let cubes;
    let graph;
    document.addEventListener("interactiveViewportStarted", start);
    async function start(_event) {
        viewport = _event.detail;
        viewport.camera.mtxPivot.translateZ(-5);
        graph = viewport.getBranch();
        // setup audio
        let cmpListener /* : ƒ.ComponentAudioListener */ = new ƒ.ComponentAudioListener();
        graph.addComponent(cmpListener);
        ƒ.AudioManager.default.listenWith(cmpListener);
        ƒ.AudioManager.default.listenTo(graph);
        ƒ.Debug.log("Audio:", ƒ.AudioManager.default);
        // draw viewport once for immediate feedback
        ƒ.Render.prepare(graph);
        viewport.draw();
        // dispatch event to signal startup done
        ƒ.Debug.setFilter(ƒ.DebugTextArea, ƒ.DEBUG_FILTER.ALL);
        // document.body.appendChild(ƒ.DebugTextArea.textArea);
        document.addEventListener("pointerdown", hndEvent);
        document.addEventListener("pointermove", hndEvent);
        document.addEventListener("pointerup", hndEvent);
        graph.addEventListener("check", checkWin);
        cubes = viewport.getBranch().getChildrenByName("Cube");
        await setupCubes();
        // for (let line of data) {
        //   await fetch(line.img);
        // }
        ƒ.Loop.addEventListener("loopFrame" /* ƒ.EVENT.LOOP_FRAME */, update);
        ƒ.Loop.start(); // start the game loop to continously draw the viewport, update the audiosystem and drive the physics i/a
    }
    function update(_event) {
        // ƒ.Physics.simulate();  // if physics is included and used
        viewport.draw();
        ƒ.AudioManager.default.update();
    }
    async function setupCubes() {
        //create an array for controlled randomness
        let lines = [];
        for (let i = 0; i < Script.data.length; i++)
            lines.push(i);
        // pick the line to ask for
        let solution = Script.data[ƒ.Random.default.splice(lines)];
        let meenzer = [];
        let german = [];
        let img = [];
        // choose 5 wrong answers per category
        for (let i = 0; i < 5; i++) {
            meenzer.push(Script.data[ƒ.Random.default.splice(lines)].meenzer);
            german.push(Script.data[ƒ.Random.default.splice(lines)].german);
            img.push(Script.data[ƒ.Random.default.splice(lines)].img);
        }
        // choose winning combination
        let win = [];
        for (let i = 0; i < 3; i++)
            win.push(ƒ.Random.default.getRangeFloored(0, 6));
        // insert correct answers at winning positions into each cube
        meenzer.splice(win[0], 0, solution.meenzer);
        german.splice(win[1], 0, solution.german);
        img.splice(win[2], 0, solution.img);
        // setup cubes with the information about the contents and the correct side
        let contents = [meenzer, german, img];
        for (let index in cubes) {
            let content = contents[index];
            await cubes[index].getChild(0).getComponent(Script.Cube).setTextures(content, win[index]);
            cubes[index].mtxLocal.rotateY(10 * (1 - Number(index)));
        }
    }
    function hndEvent(_event) {
        for (let cube of cubes)
            cube.getChild(0).radius = 0.5; //smaller radius for picking
        viewport.dispatchPointerEvent(_event);
        switch (_event.type) {
            case ("pointerup"):
                graph.broadcastEvent(new CustomEvent("reset", { detail: _event }));
                break;
        }
    }
    async function checkWin() {
        let check = [];
        let win = true;
        for (let cube of cubes) {
            let correct = cube.getChild(0).getComponent(Script.Cube).check();
            check.push(correct);
            if (!correct)
                win = false;
        }
        console.log(check);
        if (win) {
            alert("Ei wunnerbaah!");
            window.location.reload();
        }
        return win;
    }
})(Script || (Script = {}));
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class Wobble extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static { this.iSubclass = ƒ.Component.registerSubclass(Wobble); }
        #cmpMeshPivot;
        constructor() {
            super();
            // Activate the functions of this component as response to events
            this.hndEvent = (_event) => {
                switch (_event.type) {
                    case "componentAdd" /* ƒ.EVENT.COMPONENT_ADD */:
                        this.node.addEventListener("renderPrepare" /* ƒ.EVENT.RENDER_PREPARE */, this.hndEvent);
                        break;
                    case "componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */:
                        this.removeEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
                        this.removeEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                        break;
                    case "nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */:
                        this.#cmpMeshPivot = this.node.getComponent(ƒ.ComponentMesh).mtxPivot;
                        break;
                    case "renderPrepare" /* ƒ.EVENT.RENDER_PREPARE */:
                        console.log("Prepare");
                        this.#cmpMeshPivot.scaling = new ƒ.Vector3(ƒ.Random.default.getRange(0.8, 1.2), ƒ.Random.default.getRange(0.8, 1.2), ƒ.Random.default.getRange(0.8, 1.2));
                        break;
                }
            };
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* ƒ.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* ƒ.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* ƒ.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
    }
    Script.Wobble = Wobble;
})(Script || (Script = {}));
//# sourceMappingURL=Script.js.map