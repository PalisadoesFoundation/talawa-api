class Hash {
    constructor(image) {
        this.imageAlreadyInDb = image;
    }

    setImageAlreadyInDb(image) {
        this.imageAlreadyInDb = image;
    }

    getImageAlreadyInDb(){
        return this.imageAlreadyInDb
    }
}

module.exports = Hash;