export default class SwiperMaterial extends EventTarget {
    constructor(container, opts={}){
        super()
        this.opts = Object.assign({
            sizes: [0.7, 0.2, 0.1],
            drag: true,
            click: true,
            activeTreshold: 0.9
        }, opts)

        this.container = container

        this._currentIndex = 2
        this._targetIndex = this._currentIndex
        this.startDrag = null
        this.currentDrag = 0
        this.moveDrag = 0
        
        this.activeSize = 0.7
        this.idleCount = 2
        this.idleReduction = 2/3
        this.dragModifier = 1.5
        
        
        this.items = Array.from(this.container.children)
        
        this.sizes = [0.7, 0.2, 0.1]

        //this.computeSizes()

        this.updateRect()
        this.bind()

        this.update()
    }

    bindDrag(){
        this.container.addEventListener('mousedown', (e)=>{
            this.updateRect()
            this.startDrag = e.clientX
            this.moveDrag = 0
            const initialOffset = this.currentDrag / this.dragModifier * this.rect.width
            this.startDrag -= initialOffset
        })
        window.addEventListener('mousemove', (e)=>{
            if(!this.startDrag) return;
            this.moveDrag = e.clientX - this.startDrag
            this.currentDrag = (e.clientX - this.startDrag)/this.rect.width * this.dragModifier
            this.update()
        })
        window.addEventListener('mouseup', (e)=>{
            if(!this.startDrag) return;
            this.startDrag = null
            if(!this.moveDrag) return;
            this.applyCurrentDrag()
            this.loop()
        })
    }   

    bind(){
        if(this.opts.drag) this.bindDrag()

        if(this.opts.click) this.bindItems('click', (e,item,i)=>{
            if(this.moveDrag) return;
            this.setIndex(i)
        })
    }

    bindItems(eventName, callback){
        this.items.map((item,i) => item.addEventListener(eventName, (e)=> callback(e,item,i)))
    }

    applyCurrentDrag(){
            const nextIndex = minmax(this._currentIndex - Math.sign(this.currentDrag), 0, this.items.length-1)
            
            this.currentDrag -= this._currentIndex - nextIndex
            this._currentIndex = nextIndex

            if(nextIndex == 0 || nextIndex == this.items.length - 1) return;
            if(Math.abs(this.currentDrag) > 0.5) this.applyCurrentDrag()
        
    }

    computeSizes(){
        this.sizes = [this.activeSize]
        let sizeLeft = (1 - this.activeSize) / 2
        for(let i = 0; i < this.idleCount - 1; i++){
            const currentSize = sizeLeft * this.idleReduction
            this.sizes.push(currentSize)
            sizeLeft -= currentSize
        }
        this.sizes.push(sizeLeft)
    }

    loop(){
        if(!this.currentDrag || this.startDrag) return;
        this.currentDrag = lerp(0, this.currentDrag, 1/10)
        if(Math.abs(this.currentDrag) < 0.0000000001) this.currentDrag = 0
        this.update()
        requestAnimationFrame(this.loop.bind(this))
    }

    update(){
        const index = minmax(this._currentIndex - this.currentDrag, -0.99, this.items.length - 0.01)
        this.items.map((item, i)=>{
            const dist = Math.abs(index - i)
            const prevDist = Math.floor(dist)
            const nextDist = prevDist + 1
            let prevValue = this.sizes[prevDist] || 0
            let nextValue = this.sizes[nextDist] || 0
            if(i == 0 && index < 0) {
                nextValue = prevValue * 2
            }
            if(i == this.items.length - 1 && index > this.items.length - 1){
                nextValue = prevValue * 2
            }
            const ratio = dist - prevDist
            const targetValue = lerp(nextValue, prevValue, ratio)
            item.style.setProperty("--ratio", targetValue / this.activeSize)
            item.style.width = targetValue * 200 + "%"
            item.classList.toggle('active', targetValue / this.activeSize > this.activeTreshold)
        })
    }

    updateRect(){
        this.rect = this.container.getBoundingClientRect()
        this.container.style.setProperty('--container-width', this.rect.width + "px")
        this.container.style.setProperty('--container-height', this.rect.height + "px")
        this.container.style.setProperty('--active-size', this.activeSize)
    }

    setIndex(index){
        index = minmax(index, 0, this.items.length-1)
        this.currentDrag = index - this._currentIndex
        this._currentIndex = index
        this.loop()
    }

    next(){
        this.setIndex(this._currentIndex + 1)
    }
    prev(){
        this.setIndex(this._currentIndex - 1)
    }
}

function lerp(a,b,v){
    return a * v + b * (1 - v)
}
function minmax(v, min, max){
    return Math.min(max, Math.max(min, v))
}