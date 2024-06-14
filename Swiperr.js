export default class Swiperr {
    constructor(container){
        this.container = container

        this.currentIndex = 2
        this.startDrag = null
        this.currentDrag = 0
        
        this.activeSize = 0.7
        this.idleCount = 2
        this.idleReduction = 2/3
        this.dragModifier = 1.5
        
        this.items = Array.from(this.container.children)

        this.computeSizes()

        this.sizes = [0.7, 0.2, 0.15]

        this.updateRect()
        this.bind()

        this.update()
    }

    bind(){
        this.container.addEventListener('mousedown', (e)=>{
            this.updateRect()
            this.startDrag = e.clientX
            const initialOffset = this.currentDrag / this.dragModifier * this.rect.width
            this.startDrag -= initialOffset
        })
        window.addEventListener('mousemove', (e)=>{
            if(!this.startDrag) return;
            this.currentDrag = (e.clientX - this.startDrag)/this.rect.width * this.dragModifier
            this.update()
        })

        window.addEventListener('mouseup', (e)=>{
            if(!this.startDrag) return;
            this.startDrag = null    
            
            this.applyCurrentDrag()

            this.loop()
        })

        /*
        this.bindItems('click', (e,item,i)=>{
            this.setIndex(i)
        })
        */

        this.container.addEventListener('dragstart', (e)=> e.preventDefault())
    }

    bindItems(eventName, callback){
        this.items.map((item,i) => item.addEventListener(eventName, (e)=> callback(e,item,i)))
    }

    applyCurrentDrag(){
        if(Math.abs(this.currentDrag) > 0.3){
            const nextIndex = minmax(this.currentIndex - Math.sign(this.currentDrag), 0, this.items.length-1)
            
            this.currentDrag -= this.currentIndex - nextIndex
            this.currentIndex = nextIndex

            if(nextIndex == 0 || nextIndex == this.items.length - 1) return;
            if(Math.abs(this.currentDrag) > 0.5) this.applyCurrentDrag()
        }
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
        const index = minmax(this.currentIndex - this.currentDrag, 0, this.items.length-1)
        this.items.map((item, i)=>{
            const dist = Math.abs(index - i)
            const prevDist = Math.floor(dist)
            const nextDist = prevDist + 1
            let prevValue = this.sizes[prevDist] || 0
            let nextValue = this.sizes[nextDist] || 0
            const ratio = dist - prevDist
            const targetValue = lerp(nextValue, prevValue, ratio)
            item.style.setProperty("--ratio", targetValue / this.activeSize)
            item.style.width = targetValue * 200 + "%"
            item.classList.toggle('active', targetValue / this.activeSize > 0.9)
        })
    }

    updateRect(){
        this.rect = this.container.getBoundingClientRect()
        this.container.style.setProperty('--container-width', this.rect.width + "px")
        this.container.style.setProperty('--container-height', this.rect.height + "px")
        this.container.style.setProperty('--active-size', this.activeSize)
    }
}

function lerp(a,b,v){
    return a * v + b * (1 - v)
}
function minmax(v, min, max){
    return Math.min(max, Math.max(min, v))
}