/* -----------------------------------------------------------------------------------------------------------------------------------------------------------
In this multiline comment block:
// - means WIP
/// - means finished or will update in the future
//// - means partially finished, will either edit or leave alone.

/// Sort images gathered by either last added, or in alphabetical order in either forward or reverse.
//// build a filtering to only grab the images that have the same name, excluding the extension i.e (png, jpg, jpeg) etc.

/// figure out an effective way to display the image and the name so user can figure out what image is which

/// figure out how to 'preview' an image, for example if you click the image, show an enlarged version.

/// Allow User to download image when shown the enlarged version.
// Have an alternate method of displaying all the pictures for the user to download multiple images at a time.
--------------------------------------------------------------------------------------------------------------------------------------------------------------*/

// May switch between JQuery and Javascript throughout code as I have more current knowledge in raw Javascript as compared to JQuery.
let tileCount = 25;
let start = 0;
let end = tileCount;
let images = [];
let sortedImages = [];

$(document).ready(function() {
    //console.log("Clientside Booted Up!");
    // Retrieves images and displays the image tiles
    generateGridView();
    
    // allows for scrolling backwards to see previous tiles
    $('#previous').click(function() {
        // determines if scrolling is valid, and moves the start back by the set tile count

        // Think about implementing the start and end in the function instead?
        if(start != 0)
        {
            start -= tileCount;
            end -= tileCount;   
        }

        // if the trimmed filter is not blank, filter the images to match the input with the start and end
        if($("#filter").val().trim() != '')
        {
            const filter = $("#filter").val().toLowerCase().trim();
            searchImages(sortedImages.filter(str => str.toLowerCase().includes(filter)));
        }
        // otherwise redisplay the images with new start and end
        else 
        {
            displayImage();
        }
    });

    $('#next').click(function() {
        if(end < images.length) {
            start += tileCount;
            end += tileCount;
        }
        
        if($("#filter").val().toLowerCase().trim() != '')
        {
            const filter = $("#filter").val().toLowerCase().trim();
            searchImages(sortedImages.filter(str => str.toLowerCase().includes(filter)));
        }
        else 
        {
            displayImage();
        }
    });

    $('#sortby').change(function() {
        console.log($('#sortby').val());

        switch ($('#sortby').val()) {
            case "alpha":
                // copies list from images to sort in alphabetical order (case-insensitive)
                // localeCompare() seems to act similarly to .compareTo() in C#
                sortedImages = images.map(x => x.name).toSorted((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                // redisplay images
                displayImage();
                console.log("Sorted by Alpha");
                break;
            case "alpha re":
                // copies list from images to sort in reverse alphabetical order (case-insensitive)
                sortedImages = images.map(x => x.name).toSorted((a, b) => b.toLowerCase().localeCompare(a.toLowerCase()));
                // redisplay images
                displayImage();
                console.log("Sorted by Reverse Alpha");
                break;
            case "date new":
                // copies list from images to sort by newest date
                sortedImages = images.toSorted((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate)).map(x => x.name);
                console.log(images.toSorted((a, b) => new Date(b.modifiedDate) - new Date(a.modifiedDate)));
                // redisplay images
                displayImage();
                console.log("Sorted by Newest Date");
                break;
            case "date old":
                // copies list from images to sort by oldest date
                sortedImages = images.toSorted((a, b) => new Date(a.modifiedDate) - new Date(b.modifiedDate)).map(x => x.name);
                // redisplay images
                displayImage();
                console.log("Sorted by Oldest Date");
                break;
        }
        $("#filter").val('');
    });

    $("#filter").on('input', function() {
        console.log($("#filter").val());
        
        // Reset start parameters back to default
        start = 0;
        end = tileCount;

        searchImages(sortedImages.filter(str => str.toLowerCase().includes($("#filter").val().toLowerCase().trim())));
    });
    $("#clear").click(function() {
        console.log("Clear Search");
        $("#filter").val('');

        // Reset start parameters back to default
        start = 0;
        end = tileCount;
        displayImage();
    });
    
    $("#closeButton").click(hidePopup);
    hidePopup();

    $("#downloadButton").click(downloadImage);

    /*
    $("#testTable").on('click', function() {
        createFileTable(images.toSorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())));
        const table = $("#imageList");
        table.attr("data-sortby", "Name");
        table.attr("data-sortdir", "asc");
    }); */

    // Need to fix drag and drop background
    const upload = document.getElementById("upload");
    upload.addEventListener('dragover', (event) => {
        event.preventDefault();
        upload.style.background = "Gray";

    });

    upload.addEventListener('dragleave', (event) => {
        upload.style.background = "White";
    });

    upload.addEventListener('drop', (event) => {
        event.preventDefault();
        upload.style.background = "White";
        
        document.getElementById("fileInput").files = event.dataTransfer.files;
        listUploadedFiles(file);
    });

    document.getElementById("uploadLink").addEventListener('click', (event) => {
        document.getElementById('fileInput').click();
    });

    // checks if the files inputted change to reflect on UI
    document.getElementById('fileInput').addEventListener("change", (event) => {
        listUploadedFiles(document.getElementById("fileInput").files);
    });

    // Close Upload Modal
    const uploadModal = document.getElementById("uploadPopup");

    // Onload, hide the upload modal
    $("#uploadPopup").hide();

    window.onclick = function(event) {
        if (event.target == uploadModal) {
            closeUploadModal();
        }
    }
    $("#closeModal").click(closeUploadModal);
    document.getElementById("confirmUpload").addEventListener('click', (event) => {
        if(!retrieveFiles()) {
            closeUploadModal();
        }
    }); 



    // Unused
    //$("#cancelUpload").click(closeUploadModal);
})

function downloadImages() {
    const checkedImages = Array.from(document.querySelectorAll(".checkData:checked")).map(x => x.id);
    console.log(checkedImages);
    downloadMultipleImages(checkedImages);
}

function generateGridView() {
    // Hide elements related to Grid View
    $("#file-table").hide();
    $("#file-actions").hide();
    $("#file-table").html("");

    // Show elements related to List View
    $("#tiles").show();
    $("#sortby").show();
    $(".seperate").show(); 
    $("#imageSelect").show();

    // Resets the start and end parameters to default
    start = 0;
    end = tileCount;

    // Generates the tiles
    loadImages();
}

function generateListView() {
    // Hide elements related to Grid View
    $("#tiles").hide();
    $("#tites").html("");

    $("#sortby").hide();
    $(".seperate").hide(); 
    $("#imageSelect").hide();

    // Show elements related to List View
    $("#file-table").show();
    $("#file-actions").show();

    // Creates the file Table
    createFileTable(images.toSorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())));
    const table = $("#imageList");
    table.attr("data-sortby", "Name");
    table.attr("data-sortdir", "asc");
}

function openUploadModal() {
    $("#uploadPopup").show();
    console.log("Pressed");
}

function listUploadedFiles(files) {
    const fileList = document.getElementById("uploadList");
    $(".upload-drop").hide();
    fileList.innerHTML = "";

    Array.from(files).forEach(file => {
        const item = document.createElement("div");
        item.className = 'fileItem';

        const fileIcon = document.createElement('i');
        fileIcon.classList.add('fileIcon');
        fileIcon.classList.add('far');
        fileIcon.classList.add('fa-file-image')

        const fileName = document.createElement('p');
        fileName.className = 'fileName';
        fileName.innerHTML = file.name;

        const fileSize = document.createElement('p');
        fileSize.className = 'fileSize';
        fileSize.innerHTML = `${(file.size / 1024 / 1024).toFixed(2)} MB`

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('deleteBtn');
        deleteBtn.classList.add('material-icons');
        deleteBtn.innerHTML = "close";

        deleteBtn.onclick = () => {
            const dataTransfer = new DataTransfer();

            Array.from(document.getElementById("fileInput").files).forEach(removeFile => {
               if (removeFile.name !== file.name) {
                   dataTransfer.items.add(removeFile);
               }
            });
            document.getElementById("fileInput").files = dataTransfer.files;
            item.remove();
            
            if(document.getElementById("fileInput").files.length === 0) {
                $(".upload-drop").show();
            }
        };

        item.appendChild(fileIcon);
        item.appendChild(fileName);
        item.appendChild(fileSize);
        item.appendChild(deleteBtn);

        fileList.appendChild(item);
    });
}

function closeUploadModal() {
    $("#uploadPopup").hide();
}

function validateFiles(file) {
    var imagesData = [];
    var validImage = true;
        
    for(let x = 0; x < file.length; x++) {
        if(!file[x].type.startsWith('image/')) {
            validImage = false;
            console.log(`File ${file[x].name} is not a valid Image!`);
            return;
        }
        else if(file[x].size == 0) {
            validImage = false;
            console.log(`File has 0 dimensions ${file[x].name} is not a valid Image!`);
            return;
        }
        else {
            imagesData.push(file[x]);
        }
    }

    return imagesData;
}
function retrieveFiles() {
    const filesGiven = document.getElementById("fileInput");
    var validatedFiles = validateFiles(filesGiven.files);
    console.log(validatedFiles);

    if(validatedFiles && validatedFiles.length !== 0) {
        uploadImages(validatedFiles);
        return true;
    }
    return false;
}

function createTile(data) {
    // change the class to reflect on actual usage
    let tile = `<div class="test">${data}</div>`;
    $("#tiles").append(tile);
}

async function loadImages() {
    try {
        const response = await fetch('/images');
        images = await response.json();
        sortedImages = images.map(e => e.name);
        displayImage();
    }
    catch (error) {
        console.error("Error fetching images:", error);
    }
}
function displayImage() {
    const tileHolder = $("#tiles");
    tileHolder.empty();

    let imagesDisplayed = sortedImages.slice(start, end);

    imagesDisplayed.forEach(element => {
        const newDiv = document.createElement('div');
        const imgName = document.createElement('p');
        imgName.innerHTML = `${element}`;
        const imgElem = document.createElement('img');
        newDiv.classList.add('tile');
        imgElem.classList.add('test');
        imgElem.src = `/files/images/${element}`;

        newDiv.append(imgElem);
        newDiv.append(imgName);
        tileHolder.append(newDiv);
    });

    // Disable previous button if on the first page
    $("#previous").prop('disabled', start === 0);
      
    // Disable next button if on the last page
    $('#next').prop('disabled', end >= sortedImages.length);

    // resubscribe listeners to images
    $(".test").click(imageClicked);
}
function searchImages(filteredImages) {
    const tileHolder = $("#tiles");
    tileHolder.empty();

    let imagesDisplayed = filteredImages.slice(start, end);

    imagesDisplayed.forEach(element => {
        const newDiv = document.createElement('div');
        const imgName = document.createElement('p');
        imgName.innerHTML = `${element}`;
        const imgElem = document.createElement('img');
        newDiv.classList.add('tile');
        imgElem.classList.add('test');
        imgElem.src = `/files/images/${element}`;

        newDiv.append(imgElem);
        newDiv.append(imgName);
        tileHolder.append(newDiv);
    });

    // Disable previous button if on the first page
    $("#previous").prop('disabled', start === 0);
      
    // Disable next button if on the last page
    $('#next').prop('disabled', end >= filteredImages.length);

    // resubscribe listeners to images
    $(".test").click(imageClicked);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Click on images
function imageClicked() {
    console.log(this.src);
    $("#popup-image").prop('src', this.src);
    let imageName = this.src.split("/");
    $("#image-desc").html(imageName[imageName.length-1].replaceAll('%20', ' '));
    $("#popup").show();
}
function hidePopup() {
    $("#image-desc").html('');
    $("#popup").hide();
}

async function downloadImage() {
    const response = fetch(`/download-image/${$('#image-desc').html()}`);
    //console.log(response.blob());

    response.then(res => res.blob()).then(prom => {
        // Create a link element
        const link = document.createElement('a');
        // Create a URL for the blob
        const url = URL.createObjectURL(prom);
        // Set the href and download attributes of the link
        link.href = url;
        link.download = $('#image-desc').html();
        // Append the link to the body
        document.body.appendChild(link);
        // Programmatically click the link to trigger the download
        link.click();
        // Remove the link from the document
        document.body.removeChild(link);
    });
}

async function downloadMultipleImages(images) {
    // const response = fetch(`/download-images/${images}`);
    const response = fetch('/download-images/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(images),  
    });

    response.then(res => res.blob()).then(prom => {
        // Create a link element
        const link = document.createElement('a');
        // Create a URL for the blob
        const url = URL.createObjectURL(prom);
        // Set the href and download attributes of the link
        link.href = url;
        link.download = "pictures.zip";
        // Append the link to the body
        document.body.appendChild(link);
        // Programmatically click the link to trigger the download
        link.click();
        // Remove the link from the document
        document.body.removeChild(link);
    });
}

function uploadImages(images) {
    console.log(images);
    const data = new FormData();

    for (const file of images) {
        data.append("file", file);
    }
    console.log(...data);
    const response = fetch('/upload-images/images', {
        method: 'POST',
        body: data,
    });

    response.then(res => res.json()).then(data => console.log(data));
}
/////////////////////////////////////////////////////////////////////////////////////////////////////
// Create a table for scrolling for all images/videos

function createFileTable(fileData) {
    // sort images by name
    //let fileData = images.toSorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    // create table constants
    const table = document.createElement('table');
    const header = document.createElement('thead'); 
    const body = document.createElement('tbody');

    // give the table an identifier
    table.id = "imageList";

    // create headers for table
    let tHeaders = [["Name", "sortName"], ["Last Modified", "sortModified"], ["Size", "sortSize"], ["Type", "sortType"]];

    // append header and body to the table
    table.append(header);
    table.append(body);

    // create table header row
    let tableRow = document.createElement('tr');
    header.append(tableRow);

    // fill in header row
    // create checkbox
    var tableHeader = document.createElement('th');
    let checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.id = "selectall";
    tableHeader.append(checkbox);
    tableRow.append(tableHeader);
    // create the rest of the headers 
    for(let headerNames = 0; headerNames < tHeaders.length; headerNames++) {
        var tableHeader = document.createElement('th');
        tableHeader.innerHTML = tHeaders[headerNames][0];
        tableHeader.id = tHeaders[headerNames][1];
        tableRow.append(tableHeader);
    }
    
    // populate table Data
    for(let x = 0; x < fileData.length; x++) {
        // create new table row
        let tableRow = document.createElement('tr');
        body.append(tableRow);

        // create checkbox to select specific images
        var tableData = document.createElement('td');
        let checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.id = `${fileData[x].name}`;
        checkbox.classList = "checkData";
        tableData.append(checkbox);
        tableRow.append(tableData);

        // create table data to store file name
        var tableData = document.createElement('td');
        tableData.innerHTML = `${fileData[x].name}`;
        tableRow.append(tableData);

        // create table data to store file modified date, Note: figure out how to split and fix up the date before displaying
        var tableData = document.createElement('td');
        tableData.innerHTML = fileData[x].modifiedDate;
        tableRow.append(tableData);

        // create table data to store the file size
        var tableData = document.createElement('td');
        tableData.innerHTML = getFileSize(fileData[x].size);
        tableRow.append(tableData);

        // create table data to store the file type
        var tableData = document.createElement('td');
        tableData.innerHTML = getFileType(fileData[x].name);
        tableRow.append(tableData);
    }

    $("#file-table").append(table);
    //console.log(table);

    createSubscribtions();
}

// Subscribe to all related functions for the table
// CHANGE FUNCTION NAME TO REFLECT PURPOSE
function createSubscribtions() {
    // create subscription to either select all or unselect all
    $("#selectall").click(function() {
        if($("#selectall").prop('checked') == true) {
            $(".checkData").prop('checked', true);
        }
        else {
            $(".checkData").prop('checked', false);
        }
    });

    // create subscription to sort names
    $("#sortName").click(function() {
        var dataTable = retrieveDataFromTable();
        const table = $("#imageList");

        //console.log(table.data('sortby'));
        if(table.data('sortby') !== "Name" || (table.data('sortby') === "Name" && table.data('sortdir') === "desc")) {
            table.data('sortby', 'Name');
            table.data('sortdir', 'asc');

            var sortedData = dataTable.toSorted((a, b) => a.Name.toLowerCase().localeCompare(b.Name.toLowerCase()));

            console.log("Sorting by Name Ascending");
            constructTableRowsFromData(sortedData);
        }
        else if(table.data('sortby') === "Name" && table.data('sortdir') === "asc") {
            table.data('sortdir', 'desc');

            var sortedData = dataTable.toSorted((a, b) => b.Name.toLowerCase().localeCompare(a.Name.toLowerCase()));

            console.log("Sorting by Name Descending");
            constructTableRowsFromData(sortedData);
        }
    });

    // create event listener to sort by mod. date
    $("#sortModified").click(function() {
        var dataTable = retrieveDataFromTable();
        const table = $("#imageList");

        if(table.data('sortby') !== "Modified" || (table.data('sortby') === "Modified" && table.data('sortdir') === "desc")) {
            table.data('sortby', 'Modified');
            table.data('sortdir', 'asc');

            var sortedData = dataTable.toSorted((a, b) => new Date(b['Last Modified']) - new Date(a['Last Modified']));

            console.log("Sorting by Date-Modified Ascending");
            constructTableRowsFromData(sortedData);
        }
        else if(table.data('sortby') === "Modified" && table.data('sortdir') === "asc") {
            table.data('sortdir', 'desc');

            var sortedData = dataTable.toSorted((a, b) => new Date(a['Last Modified']) - new Date(b['Last Modified']));

            console.log("Sorting by Date-Modified Descending");
            constructTableRowsFromData(sortedData);
        }
    });

    // create event listener to sort by file size
    $("#sortSize").click(function() {
        var dataTable = retrieveDataFromTable();
        const table = $("#imageList");

        if(table.data('sortby') !== "Size" || (table.data('sortby') === "Size" && table.data('sortdir') === "desc")) {
            table.data('sortby', 'Size');
            table.data('sortdir', 'asc');

            var sortedData = dataTable.toSorted((a, b) => {
                const firstElem = a['Size'].split(' ');
                const secondElem = b['Size'].split(' ');
                return Number(firstElem[0]) - Number(secondElem[0]);
            });

            console.log("Sorting by File Size Ascending");
            constructTableRowsFromData(sortedData);
        }
        else if(table.data('sortby') === "Size" && table.data('sortdir') === "asc") {
            table.data('sortdir', 'desc');

            var sortedData = dataTable.toSorted((a, b) => {
                const firstElem = a['Size'].split(' ');
                const secondElem = b['Size'].split(' ');
                return Number(secondElem[0]) - Number(firstElem[0]);
            });

            console.log("Sorting by File Size Descending");
            constructTableRowsFromData(sortedData);
        }
    });
}

function constructTableRowsFromData(tableRows) {
    let tableBody = document.getElementById("imageList").querySelector('tbody');

    tableBody.innerHTML = '';
    //console.log(tableRows);
    tableRows.forEach(cells => {
        let row = document.createElement('tr');

        // create checkbox to select specific images
        var tableCell = document.createElement('td');
        let checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.id = `${cells.Name}`;
        checkbox.classList = "checkData";
        tableCell.append(checkbox);
        row.append(tableCell);

        for (let data of Object.values(cells)) {
            // create table data for rows corresponding to each image
            tableCell = document.createElement('td');
            tableCell.innerHTML = data;

            row.append(tableCell);
            //console.log(data);
        }
        tableBody.append(row);
        //console.log(cells);
    });
}

function retrieveDataFromTable() {
    // retrieve table, and table headers
    const tempTable = document.getElementById("imageList");
    let headers = Array.from(tempTable.rows[0].cells).slice(1).map(x => x.textContent)

    // fetch all data in the rows except for the header row, and excluding the checkboxes
    var rowArray = Array.from(tempTable.rows).slice(1).map(x => {
        let data = {};
        Array.from(x.cells).slice(1).forEach((cell, index) => {
            data[headers[index]] = cell.textContent.trim();
        });
        return data;
    });

    // used to see data result
    console.log(rowArray);

    return rowArray;
}

// Retrieve file type
function getFileType(fileName) {
    // Retrieves file type
    const extension = fileName.split('.').pop().toLowerCase();
  
    // Defines file extensions to MIME types 
    const mimeTypes = {
      'jpg': 'Image JPEG',
      'jpeg': 'Image JPEG',
      'png': 'Image PNG',
      'gif': 'Image GIF',
    };
  
    // Retrieve the MIME type
    const mimeType = mimeTypes[extension] || 'unknown';
  
    return mimeType;
}

// Retrieve Appropriate Size
function getFileSize(fileSize) {
    // define prefixes and current index
    let prefixes = ["bytes", "KB", "MB", "GB"];
    let index = 0;

    // the current bytes
    var bytes = fileSize;

    // while the byte is greater than 1000 and the prefix is valid
    while(bytes >= 1000 && index < prefixes.length - 1) {
        // divide the bytes by 1000 for the next prefix and increment index
        bytes /= 1000;
        index++;
    }

    // return a formatted string
    return `${bytes.toFixed(1)} ${prefixes[index]}`;
}