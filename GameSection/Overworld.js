class Overworld {
    constructor(config) {
        this.element = config.element;
        this.canvas = this.element.querySelectector(".game-canvas");
        this.ctx = this.canvas.getContext("2d"); //this gives access to many drawing methods of a canvas 
    }
    
    init(){
        const image = new Image();
        image.onload = ()=>{
            this.ctx.drawImage(image,0,0);
        }
        image.src = "/images/maps/DemoLower.png";
    }
}

