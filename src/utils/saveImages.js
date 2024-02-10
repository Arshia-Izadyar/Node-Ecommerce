const {v4: uuid} = require('uuid')
const path = require('path');   



async function saveImages(imageList) {
    let filePaths = []; 
    
    // if (imageList.length){

        for (let i = 0; i < imageList.length; i++){
            let image = imageList[i]
            
            let newFileName = uuid()
            let splittedOldFilename = image.name.split('.')
            console.log(splittedOldFilename);
            newFileName = `${newFileName}.${splittedOldFilename[splittedOldFilename.length - 1]}`
            if (image.size > 1024 * 1024 * 100) {
                throw new Error('file is too big')
            }
            const uploadDir = path.resolve(__dirname, '../public/uploads/', newFileName)
            filePaths.push(`/statics/uploads/${newFileName}`)
            await image.mv(uploadDir)
            
            
        }
    // } else {
    //     let image = imageList
        
    //     let newFileName = uuid()
    //     let splittedOldFilename = image.name.split('.')
    //     newFileName = `${newFileName}.${splittedOldFilename[splittedOldFilename.length - 1]}`
    //     if (image.size > 1024 * 1024 * 100) {
    //         throw new Error('file is too big')
    //     }
    //     const uploadDir = path.resolve(__dirname, '../public/uploads/', newFileName)
    //     filePaths.push(`/statics/uploads/${newFileName}`)

    //     await image.mv(uploadDir)
    // }
    return filePaths
}



module.exports = saveImages