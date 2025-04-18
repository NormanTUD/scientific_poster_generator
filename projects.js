
function createProject() {
    const project_name = document.getElementById("project-name");

    if (project_name.value != "") {
        $.ajax({
            type: "POST",
            url: "account_management.php",
            data: {
                action: 'create_project',
                name: project_name.value
            },
            success: function (response) {

                if (response == "ERROR" || response == "No or invalid session") {
                    toastr["warning"]("Not logged in");
                } else {
                    loadTable(response);
                    toastr["success"]("New Project created");
                }
            },
            error: function () {
                toastr["error"]("An error occurred");
            }
        });
    }
}

//TODO: reloaded data after delete should include last edit time
function deleteRow(local_id) {
    $.ajax({
        type: "POST",
        url: "account_management.php",
        data: {
            action: 'delete_project',
            local_id: Number(local_id)
        },
        success: function (response) {
            loadTable(response);

            if (response != "No results found") {
                toastr["success"]("No Projects available");
            } else {
                toastr["success"]("Project deleted");
            }
        },
        error: function () {
            toastr["error"]("An error occurred");
        }
    });
}

function deleteItem(parent_id, local_id) {

    if (parent_id == 'author-list') {
        $.ajax({
            type: "POST",
            url: "account_management.php",
            data: {
                action: "delete-author",
                id: Number(local_id)
            },
            success: function (response) {
                console.log(response);
                fetch_authors_list();
            },
            error: function (err) {
                console.error(err);
            }
        });
    }

    if (parent_id == 'image-list') {
        $.ajax({
            type: "POST",
            url: "account_management.php",
            data: {
                action: "delete-image",
                id: Number(local_id)
            },
            success: function (response) {
                console.log(response);
                fetch_images();
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
}

function updateVisibility(id, value) {
    $.ajax({
        type: "POST",
        url: "account_management.php",
        data: {
            action: "update-visibility",
            id: id,
            value: value
        },
        success: function (response) {
            console.log(response);
        },
        error: function (err) {
            console.error(err);
        }
    });
}

// TODO: may need an overwork
function createTableFromJSON(id, data, editable_columns, ...additional_columns) {
    const table = document.createElement("table");
    table.setAttribute("border", "1");

    const headerRow = document.createElement("tr");
    const headers = Object.keys(data);

    const config = {};

    headers.forEach(header => {
        const th = document.createElement("th");
        th.innerText = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    for (let i = 0; i < data[headers[0]].length; i++) {
        const row = document.createElement("tr");
        row.id = id + "--nr-" + (i + 1);

        headers.forEach(header => {
            const td = document.createElement("td");

            if (header == "visible") {
                const elem = document.createElement("INPUT");
                elem.setAttribute("type", "checkbox");
                elem.checked = data[header][i];
                elem.onclick = function () {
                    updateVisibility(this.closest('tr').id.split("--nr-")[1], this.checked ? 1 : 0);
                }
                td.appendChild(elem);
            } else if (header == "image_data") {
                const container = document.createElement("DIV");
                const img = document.createElement("IMG");
                img.src = '';

                container.appendChild(img);
                td.appendChild(container);

            } else {
                if (editable_columns.includes(headers.indexOf(header))) {

                    const elem = document.createElement("INPUT");
                    elem.setAttribute("type", "text");
                    elem.value = data[header][i];

                    elem.onchange = async function () {
                        var param = this.closest('tr').id.split("--nr-");
                        console.log(this.value, ...param);

                        if (param[0] == 'author-list') {
                            $.ajax({
                                type: "POST",
                                url: "account_management.php",
                                data: {
                                    action: "rename-author",
                                    name: this.value,
                                    id: Number(param[1])
                                },
                                success: function (response) {
                                    console.log(response);
                                },
                                error: function (err) {
                                    console.error(err);
                                }
                            });
                        }
                        if (param[0] == 'table-container') {
                            console.log("poster rename");

                            $.ajax({
                                type: "POST",
                                url: "account_management.php",
                                data: {
                                    action: "rename_poster",
                                    name: this.value,
                                    id: Number(param[1])
                                },
                                success: function (response) {
                                    console.log(response);
                                },
                                error: function (err) {
                                    console.error(err);
                                }
                            });
                        }
                        load_project_page_data();
                    }

                    td.appendChild(elem);

                } else {
                    td.innerText = data[header][i];
                }
            }
            row.appendChild(td);
        });

        additional_columns.forEach(column => {
            const td = document.createElement("td");
            td.appendChild(column(i));
            row.appendChild(td);
        });

        table.appendChild(row);
    }
    document.getElementById(id).appendChild(table);
}

async function edit_translation(local_id) {
    const result = await $.ajax({
        type: "POST",
        url: "account_management.php",
        data: {
            action: "edit-translation",
            local_id: local_id
        },
        success: function (response) {
            // console.log(response);
            return response;
        },
        error: function () {
            return "[ERROR]";
        }
    });
    return result;
}

async function isAdmin() {
    const result = await $.ajax({
        type: "POST",
        url: "account_management.php",
        data: {
            action: "is-admin"
        },
        success: function (response) {
            return response;
        },
        error: function () {
            return false;
        }
    });
    return result;
}

function loadTable(response) {
    $('#table-container').empty();

    if (response == "No results found") {
        // $('#table-container').html(response);
        toastr["warning"]("No results found");  //TODO: bug? execute msg twice?

    } else {
        var data = isJSON(response) ? JSON.parse(response) : response;

        const editColumn = (index) => {
            const td = document.createElement("td");
            const link = document.createElement("a");

            var linkText = document.createTextNode("Edit");
            link.appendChild(linkText);
            // link.title = "Edit";

            link.onclick = async function () {
                var local_id = this.closest('tr').id.split("--nr-")[1];
                const poster_id = await edit_translation(local_id);
                window.location.href = "poster.php?id=" + poster_id + "&mode=private";
            }

            td.appendChild(link);
            return td;
        };
        const deleteColumn = (index) => {
            const td = document.createElement("td");
            const btn = document.createElement('input');
            btn.type = "button";
            btn.className = "btn";
            btn.value = "Delete";
            btn.onclick = function () {
                deleteRow(this.closest('tr').id.split("--nr-")[1]);
            }
            td.appendChild(btn);
            return td;
        };

        createTableFromJSON("table-container", data, [0], editColumn, deleteColumn);
    }
}

function isJSON(data) {
    try {
        JSON.parse(data);
    } catch (e) {
        return false;
    }
    return true;
}

$(document).ready(function () {
    let registerForm = document.getElementById("load-form");

    load_project_page_data();
});

async function fetch_all_projects() {
    $.ajax({
        type: "POST",
        url: "account_management.php",
        data: {
            action: 'fetch_all_projects'
        },
        success: function (response) {
            if (response != "No or invalid session") {
                if (response != "No results found") {
                    loadTable(response);
                    toastr["success"]("Loading Projects");
                } else {
                    toastr["warning"]("No results found");
                }
            } else {
                toastr["warning"]("Not logged in");
            }
        },
        error: function () {
            toastr["error"]("An error occurred");
        }
    });
}

async function fetch_authors_list() {
    document.getElementById("author-list").replaceChildren();

    $.ajax({
        type: "POST",
        url: "account_management.php",
        data: {
            action: "fetch_authors",
        },
        success: function (response) {
            // console.log(JSON.parse(response));

            if (response != "No or invalid session") {
                if (response != "No results found") {

                    const deleteColumn = (index) => {
                        const td = document.createElement("td");
                        const btn = document.createElement('input');
                        btn.type = "button";
                        btn.className = "btn";
                        btn.value = "Delete";
                        btn.onclick = function () {
                            var param = this.closest('tr').id.split("--nr-");

                            console.log(param[0], param[1], this.value);

                            deleteItem(...this.closest('tr').id.split("--nr-"));
                        }
                        td.appendChild(btn);
                        return td;
                    };

                    createTableFromJSON("author-list", JSON.parse(response), [0], deleteColumn);
                }
            }
        },
        error: function (err) {
            console.error(err);
        }
    });
}

async function fetch_images() {
    document.getElementById("image-list").replaceChildren();

    $.ajax({
        type: "POST",
        url: "account_management.php",
        data: {
            action: "fetch_images",
        },
        success: function (response) {

            if (response != "No or invalid session") {
                // console.log(JSON.parse(response));

                if (response != "No results found") {

                    const deleteColumn = (index) => {
                        const td = document.createElement("td");
                        const btn = document.createElement('input');
                        btn.type = "button";
                        btn.className = "btn";
                        btn.value = "Delete";
                        btn.onclick = function () {
                            // deleteRow(this.closest('tr').id.split("--nr-")[1]);
                            console.log(...this.closest('tr').id.split("--nr-"));

                            deleteItem(...this.closest('tr').id.split("--nr-"));
                        }
                        td.appendChild(btn);
                        return td;
                    };
                    createTableFromJSON("image-list", JSON.parse(response), [1], deleteColumn);

                    loadImgsInTable("image-list");
                }
            }
        },
        error: function (err) {
            console.error(err);
        }
    });
}

function load_project_page_data() {
    fetch_all_projects();
    fetch_authors_list();
    fetch_images();
}

async function loadImgsInTable(id) {
    const img_data = JSON.parse(await $.ajax({
        type: "POST",
        url: "account_management.php",
        data: {
            action: 'fetch_img_data'
        },
        success: function (response) {
            return response;
        },
        error: function () {
            console.warn("Unable to fetch Image Data");
            return "{}";
        }
    }))["image_data"];

    const table = document.getElementById(id).children[0].children;
    if (img_data.length == table.length - 1) {
        for (let i = 1; i < table.length; i++) {
            const img = table[i].querySelector('img');

            img.classList.add("table-img");
            img.src = img_data[i - 1];
            // console.log(i, img_data[i - 1]);

        }
    } else {
        console.warn("Rows and Images are unequal [" + img_data.length + ":" + (table.length - 1) + "]");
    }
}

document.getElementById("logout").onclick = function () {
    $.ajax({
        type: "POST",
        url: "account_management.php",
        data: {
            action: 'logout'
        },
        success: function (response) {
            // console.log(response);
            window.location.href = "login.php";
            toastr["success"](response);
        },
        error: function () {
            toastr["error"]("An logout error occurred");
        }
    });
}
