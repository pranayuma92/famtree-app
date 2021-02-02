console.log('running')
var sampleData = [
    { "id":  1, "name": "Me", "children": [4], "partners" : [2,3], root:true, level: 0, "parents": [8,9] },
    { "id":  2, "name": "Mistress", "children": [4], "partners" : [1], level: 0, "parents": [] },
    { "id":  3, "name": "Wife", "children": [5], "partners" : [1], level: 0, "parents": [] },
    { "id":  4, "name": "Son", "children": [], "partners" : [], level: -1, "parents": [1,2] },
    { "id":  5, "name": "Daughter", "children": [7], "partners" : [6], level: -1, "parents": [1,3] },
    { "id":  6, "name": "Boyfriend", "children": [7], "partners" : [5], level: -1, "parents": [] },
    { "id":  7, "name": "Son Last", "children": [], "partners" : [], level: -2, "parents": [5,6] },
    { "id":  8, "name": "Jeff", "children": [1], "partners" : [9], level: 1, "parents": [10,11] },
    { "id":  9, "name": "Maggie", "children": [1], "partners" : [8], level: 1, "parents": [13,14] },
    { "id": 10, "name": "Bob", "children": [8], "partners" : [11], level: 2, "parents": [12] },
    { "id": 11, "name": "Mary", "children": [], "partners" : [10], level: 2, "parents": [] },
    { "id": 12, "name": "John", "children": [10], "partners" : [], level: 3, "parents": [] },
    { "id": 13, "name": "Robert", "children": [9], "partners" : [14], level: 2, "parents": [] },
    { "id": 14, "name": "Jessie", "children": [9], "partners" : [13], level: 2, "parents": [15,16] },
    { "id": 15, "name": "Raymond", "children": [14], "partners" : [16], level: 3, "parents": [] },
    { "id": 16, "name": "Betty", "children": [14], "partners" : [15], level: 3, "parents": [] },
], 
data = [], elements = [], levels = [], levelMap = [], 
tree = document.getElementById('tree'), people = document.getElementById('people'), selectedNode, 
startTop, startLeft, gap = 60, size = 95
;

/* Template object for person */
function Person(id) {
    this.id = id ? id : '';
    this.name = id ? id : '';
    this.partners = [];
    this.siblings = [];
    this.parents = [];
    this.children = [];
    this.level = 0;
    this.root = false;
    this.picture = ''
}

/* Event listeners */
tree.addEventListener('click', function(e) {
    if (e.target.classList.contains('node')) {
        console.log(selectedNode.querySelector('h3'))
        selectedNode = e.target; 
        select(selectedNode);
        document.getElementById('title').textContent = selectedNode.textContent;
        fillPeopleAtLevel();
    }
});

document.getElementById('save').addEventListener('click', function() {
    var pname = document.getElementById('pname').value;
    var pimage = document.getElementById('savedImage').value;
    if (pname.length > 0) {
        data.forEach(function(person) {
            if (person.id == selectedNode.id) {
                person.name = pname;
                person.picture = pimage ? pimage : 'user.png';
                selectedNode.querySelector('h3').textContent = pname;
                selectedNode.querySelector('img').src = person.picture;
                document.getElementById('title').textContent = pname;
            }
        });
    }
});

document.getElementById('add').addEventListener('click', function() {
    addPerson(document.getElementById('relation').value);
    plotTree();
}); 

document.getElementById('addExisting').addEventListener('click', function() {
    attachParent();
    plotTree();
}); 

document.getElementById('clear').addEventListener('click', startFresh);

document.getElementById('sample').addEventListener('click', function() {
    data = sampleData.slice();
    plotTree();
}); 

document.getElementById('download').addEventListener('click', function() {
    if (data.length > 1) {
        var download = JSON.stringify(data, null, 4);
        var payload = "text/json;charset=utf-8," + encodeURIComponent(download);
        var a = document.createElement('a');
        a.href = 'data:' + payload;
        a.download = 'data.json';
        a.innerHTML = 'click to download';
        var container = document.getElementById('downloadLink');
        container.appendChild(a);
    }
}); 

/* Initialize */
function appInit() {
    // Approximate center of the div
    startTop = parseInt((tree.clientHeight / 2) - (size / 2)); 
    startLeft = parseInt((tree.clientWidth / 2) - (size / 2)); 
}

/* Start a fresh tree */
function startFresh() {
    var start, downloadArea = document.getElementById('downloadLink');
    // Reset Data Cache
    data = []; 
    appInit();
    while (downloadArea.hasChildNodes()) { downloadArea.removeChild(downloadArea.lastChild); }

    // Add a root "me" person to start with
    start = new Person('P01'); start.name = 'Me'; start.root = true;
    data.push(start);

    // Plot the tree
    plotTree();

    // Pre-select the root node
    selectedNode = get('P01'); 
    document.getElementById('title').textContent = selectedNode.textContent;
}

/* Plot entire tree from bottom-up */
function plotTree() {
    // Reset other cache and DOM
    elements = [], levels = [], levelMap = []
    while (tree.hasChildNodes()) { tree.removeChild(tree.lastChild); }

    // Get all the available levels from the data
    data.forEach(function(elem) {
        if (levels.indexOf(elem.level) === -1) { levels.push(elem.level); }
    });

    // Sort the levels in ascending order
    levels.sort(function(a, b) { return a - b; });

    // For all level starting from lowest one
    levels.forEach(function(level) {
        // Get all persons from this level
        var startAt = data.filter(function(person) {
            return person.level == level;
        });
        startAt.forEach(function(start) {
            var person = getPerson(start.id);
            // Plot each person in this level
            plotNode(person, 'self');
            // Plot partners
            plotPartners(person);
            // And plot the parents of this person walking up
            plotParents(person);
        });
        
    });

    // Adjust coordinates to keep the tree more or less in center
    adjustNegatives();

}

/* Plot partners for the current person */
function plotPartners(start) {
    if (! start) { return; }
    start.partners.forEach(function(partnerId) {
        var partner = getPerson(partnerId);
        // Plot node
        plotNode(partner, 'partners', start);
        // Plot partner connector
        plotConnector(start, partner, 'partners');
    });
}

/* Plot parents walking up the tree */
function plotParents(start) {
    if (! start) { return; }
    start.parents.reduce(function(previousId, currentId) {
        var previousParent = getPerson(previousId), 
            currentParent = getPerson(currentId);
        // Plot node
        plotNode(currentParent, 'parents', start, start.parents.length);
        // Plot partner connector if multiple parents
        if (previousParent) { plotConnector(previousParent, currentParent, 'partners'); }
        // Plot parent connector
        plotConnector(start, currentParent, 'parents');
        // Recurse and plot parent by walking up the tree
        plotParents(currentParent);
        return currentId;
    }, 0);
}

/* Plot a single node */
function plotNode() {
    var person = arguments[0], relationType = arguments[1], relative = arguments[2], numberOfParents = arguments[3], 
        node = get(person.id), relativeNode, element = {}, thisLevel, exists 
    ;
    if (node) { return; }
    node = createNodeElement(person); 
    // Get the current level
    thisLevel = findLevel(person.level);
    if (! thisLevel) { 
        thisLevel = { 'level': person.level, 'top': startTop }; 
        levelMap.push(thisLevel); 
    }
    // Depending on relation determine position to plot at relative to current person
    if (relationType == 'self') {
        node.style.left = startLeft + 'px'; 
        node.style.top = thisLevel.top + 'px';
    } else {
        relativeNode = get(relative.id);
    }
    if (relationType == 'partners') {
        // Plot to the right
        node.style.left = (parseInt(relativeNode.style.left) + size + (gap * 2)) + 'px';	
        node.style.top = parseInt(relativeNode.style.top) + 'px'; 
    }
    if (relationType == 'children') {
        // Plot below
        node.style.left = (parseInt(relativeNode.style.left) - size) + 'px';	
        node.style.top = (parseInt(relativeNode.style.top) + size + gap) + 'px'; 							
    }
    if (relationType == 'parents') {
        // Plot above, if single parent plot directly above else plot with an offset to left
        if (numberOfParents == 1) { 
            node.style.left = parseInt(relativeNode.style.left) + 'px'; 
            node.style.top = (parseInt(relativeNode.style.top) - gap - size) + 'px';						
        } else {
            node.style.left = (parseInt(relativeNode.style.left) - size) + 'px'; 
            node.style.top = (parseInt(relativeNode.style.top) - gap - size) + 'px';											
        }
    }

    // Avoid collision moving to right
    while (exists = detectCollision(node)) { 
        node.style.left = (exists.left + size + (gap * 2)) + 'px'; 
    }

    // Record level position
    if (thisLevel.top > parseInt(node.style.top)) {
        updateLevel(person.level, 'top', parseInt(node.style.top));
    }
    element.id = node.id; element.left = parseInt(node.style.left); element.top = parseInt(node.style.top); 
    elements.push(element);

    // Add the node to the DOM tree
    tree.appendChild(node); 
}

/* Helper Functions */

function createNodeElement(person) {
    var node = document.createElement('div');
    var picture = document.createElement('img');
    var textName = document.createElement('h3')
    picture.setAttribute("src", 'user.png');
    node.id = person.id; 
    node.classList.add('node'); node.classList.add('asset');
    textName.textContent = person.name; 
    node.setAttribute('data-level', person.level);
    node.appendChild(picture)
    node.appendChild(textName)
    return node;
}

function select(selectedNode) {
    var allNodes = document.querySelectorAll('div.node');
    [].forEach.call(allNodes, function(node) {
        node.classList.remove('selected');
    });
    selectedNode.classList.add('selected');
}

function get(id) { return document.getElementById(id); }

function getPerson(id) {
    var element = data.filter(function(elem) {
        return elem.id == id;
    });
    return element.pop();
}

function fillPeopleAtLevel() {
    if (!selectedNode) return;
    var person = getPerson(selectedNode.id), level = (person.level + 1), persons, option;
    while (people.hasChildNodes()) { people.removeChild(people.lastChild); }
    data.forEach(function(elem) {
        if (elem.level === level) {
            option = document.createElement('option');
            option.value = elem.id; option.textContent = elem.name;
            people.appendChild(option);
        }
    });
    return persons;
}

function attachParent() {
    var parentId = people.value, thisId = selectedNode.id;
    updatePerson(thisId, 'parents', parentId);
    updatePerson(parentId, 'children', thisId);
}

function addPerson(relationType) {
    var newId = 'P' + (data.length < 9 ? '0' + (data.length + 1) : data.length + 1), 
        newPerson = new Person(newId), thisPerson;
    ;
    thisPerson = getPerson(selectedNode.id);
    // Add relation between originating person and this person
    updatePerson(thisPerson.id, relationType, newId);	
    switch (relationType) {
        case 'children': 
            newPerson.parents.push(thisPerson.id); 
            newPerson.level = thisPerson.level - 1; 
            break;
        case 'partners': 
            newPerson.partners.push(thisPerson.id); 
            newPerson.level = thisPerson.level; 
            break;
        case 'siblings': 
            newPerson.siblings.push(thisPerson.id); 
            newPerson.level = thisPerson.level; 
            // Add relation for all other relatives of originating person
            newPerson = addRelation(thisPerson.id, relationType, newPerson);
            break;
        case 'parents': 
            newPerson.children.push(thisPerson.id); 
            newPerson.level = thisPerson.level + 1; 
            break;
    }

    data.push(newPerson);
}

function updatePerson(id, key, value) {
    data.forEach(function(person) {
        if (person.id === id) {
            if (person[key].constructor === Array) { person[key].push(value); }
            else { person[key] = value; }
        }
    });
}

function addRelation(id, relationType, newPerson) {
    data.forEach(function(person) { 
        if (person[relationType].indexOf(id) != -1) {
            person[relationType].push(newPerson.id);
            newPerson[relationType].push(person.id);
        }
    });
    return newPerson;
}

function findLevel(level) {
    var element = levelMap.filter(function(elem) {
        return elem.level == level;
    });
    return element.pop();
} 

function updateLevel(id, key, value) {
    levelMap.forEach(function(level) {
        if (level.level === id) {
            level[key] = value;
        }
    });
}

function detectCollision(node) {
    var element = elements.filter(function(elem) { 
        var left = parseInt(node.style.left);
        return ((elem.left == left || (elem.left < left && left < (elem.left + size + gap))) && elem.top == parseInt(node.style.top));
    });
    return element.pop();
}

function adjustNegatives() { 
    var allNodes = document.querySelectorAll('div.asset'), 
        minTop = startTop, diff = 0;
    for (var i=0; i < allNodes.length; i++) {
        if (parseInt(allNodes[i].style.top) < minTop) { minTop = parseInt(allNodes[i].style.top); }
    };
    if (minTop < startTop) {
        diff = Math.abs(minTop) + gap; 
        for (var i=0; i < allNodes.length; i++) {
            allNodes[i].style.top = parseInt(allNodes[i].style.top) + diff + 'px';
        };
    }
}

function plotConnector(source, destination, relation) {
    var connector = document.createElement('div'), 
        orientation, comboId, comboIdInverse, start, stop, 
            x1, y1, x2, y2, length, angle, transform; 
    // We do not plot a connector if already present
    comboId = source.id + '-' + destination.id;
    comboIdInverse = destination.id + '-' + source.id;
    if (document.getElementById(comboId)) { return; }
    if (document.getElementById(comboIdInverse)) { return; }

    connector.id = comboId;
    orientation = (relation == 'partners') ? 'h' : 'v';
    connector.classList.add('asset');
    connector.classList.add('connector');
    connector.classList.add(orientation);
    start = get(source.id); stop = get(destination.id);
    if (relation == 'partners') {
        x1 = parseInt(start.style.left) + size; y1 = parseInt(start.style.top) + (size/2);
        x2 = parseInt(stop.style.left); y2 = parseInt(stop.style.top);
        length = (x2 - x1) + 'px';
        
        connector.style.width = length;
        connector.style.left = x1 + 'px';
        connector.style.top = y1 + 'px';
        // Avoid collision moving down
        while (exists = detectConnectorCollision(connector)) { 
            connector.style.top = (parseInt(exists.style.top) + 4) + 'px'; 
        }
    }
    if (relation == 'parents') {
        x1 = parseInt(start.style.left) + (size/2); y1 = parseInt(start.style.top);
        x2 = parseInt(stop.style.left) + (size/2); y2 = parseInt(stop.style.top) + (size - 2);
        
        length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        transform = 'rotate(' + angle + 'deg)'; 
        
        connector.style.width = length + 'px';
        connector.style.left = x1 + 'px';
        connector.style.top = y1 + 'px';
        connector.style.transform = transform;
    }
    tree.appendChild(connector);
}

function detectConnectorCollision(connector) {
    var connectors = [].slice.call(document.querySelectorAll('div.connector.h'));
    var element = connectors.filter(function(elem) { 
    return ((elem.style.left == connector.style.left) && (elem.style.top == connector.style.top))
    });
    return element.pop();
}

document.getElementById('uploadFile').addEventListener('change', function(e){
    console.log(e.target.files)
    const files = e.target.files
    const formData = new FormData()
    formData.append('image', files[0])

    fetch('https://api.imgbb.com/1/upload?key=4c917ab6b878a2abd7b7e6a6bcedb569', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('personPicture').src = data.data.display_url
        document.getElementById('savedImage').value =  data.data.display_url
    })
    .catch(error => {
        console.error(error)
    })
})

/* App Starts Here */
appInit();
startFresh();
console.log(data)

