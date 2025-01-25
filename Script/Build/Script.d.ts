declare namespace Script {
    import ƒ = FudgeCore;
    type Content = string | Request;
    class Cube extends ƒ.ComponentScript {
        static readonly iSubclass: number;
        private start;
        private mtxCurrent;
        private cube;
        private textures;
        private free;
        private static indentity;
        private static rotate;
        constructor();
        setTextures(_content: Content[]): Promise<void>;
        private resetTextures;
        private createTexture;
        private hndEvent;
        private hndPointerEvent;
        private reset;
        private rotate;
        rotateTextures(_move: ƒ.Vector2): void;
        private calcMove;
    }
}
declare namespace Script {
    let data: {
        german: string;
        meenzer: string;
        url: Request;
    }[];
}
declare namespace Script {
}
declare namespace Script {
    import ƒ = FudgeCore;
    class Wobble extends ƒ.ComponentScript {
        #private;
        static readonly iSubclass: number;
        constructor();
        hndEvent: (_event: Event) => void;
    }
}
