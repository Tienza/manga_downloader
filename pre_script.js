((console) => {
    console.save = (data, fileName) => {
    
        if (!data) {
            console.error('Console.save: No data')
            return;
        } else {

            fileName =  (fileName) ? fileName : 'img_sources.txt';

            data = (typeof data !== "object") ? data : JSON.stringify(data, undefined, 4);

            let blob = new Blob([data], {type: 'text/json'});
            let e    = document.createEvent('MouseEvents');
            let a    = document.createElement('a');

            a.download = fileName
            a.href = window.URL.createObjectURL(blob)
            a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
            e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
            a.dispatchEvent(e)
        }
    }
})(console);
$('div#containerRoot>div').each(function (ind) {
    if ((ind) != 3) $(this).remove()
});
$('div#containerRoot>div>div[id!="divImage"]').remove();
$('#containerRoot>div>p').remove()
let imgSrcs = '';
$('img').each(function () {  
    let imgSrc = this.src;
    imgSrcs += imgSrc + "\n";
});
console.log(imgSrcs);
console.save(imgSrcs, 'img_sources.txt');
