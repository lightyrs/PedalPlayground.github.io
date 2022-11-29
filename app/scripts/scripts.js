const pedalImagePath = "public/images/pedals/";
const pedalboardImagePath = "public/images/pedalboards/";

let ds = null;
let historyBuffer = null;

$(document).ready(() => {
  // Populate Pedalboards and Pedals lists
  GetPedalData();
  GetPedalBoardData();

  // Make lists searchable
  $(".pedal-list").select2({
    placeholder: "Select a pedal",
    width: "style",
  });

  $(".pedal-list").on("select2:select", (e) => {
    $("#add-selected-pedal").trigger("click");
    console.log($(this));
    $(this).trigger("change").trigger("focus");
  });

  $(".pedalboard-list").select2({
    placeholder: "Select a pedalboard",
    width: "style",
  });

  $(".pedalboard-list").on("select2:select", function (e) {
    $("#add-selected-pedalboard").trigger("click");
    $(this).trigger("change").trigger("focus");
  });

  $(() => {
    // Load canvas from localStorage if it has been saved prior
    if (localStorage["pedalCanvas"] != null) {
      $("#pp_canvas").html(JSON.parse(localStorage["pedalCanvas"]).replaceAll(/ds\-(?:selected|hover)/g, ""));
      readyCanvas();
    } else {
      readyCanvas();
    }

    // If hidden multiplier value doesn't exist, create it
    if ($("#multiplier").length == 0) {
      $("#pp_canvas").append('<input id="multiplier" type="hidden" value="25">');
      var multiplier = 25;
      // If hidden multiplier value does exist set variable
    } else {
      var multiplier = $("#multiplier").val();
    }
    // Set canvas scale input and bg size to match scale
    $("#canvas-scale").val(multiplier);
    $("#pp_canvas").css("background-size", `${multiplier}px`);

    historyBuffer.enable();
  });

  // When user changes scale, update stuffs
  $("#canvas-scale").change(function () {
    // update var
    const multiplier = $(this).val();
    $("#multiplier").val(multiplier);

    // Update scale of bg image
    $("#pp_canvas").css("background-size", `${multiplier}px`);

    // Update all items with stored scale
    document.querySelectorAll(".item").forEach((element) => {
      element.setAttribute("data-scale", multiplier);
      const artwork = element.querySelector(".artwork");
      const scaledWidth = element.dataset.width * multiplier;
      const scaledHeight = element.dataset.height * multiplier;

      if (artwork != null) {
        $(artwork).css({
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      if (
        element.classList.contains("pedal--custom") ||
        element.classList.contains("pedalboard--custom")
      ) {
        $(element).css({
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      if (element.classList.contains("pedalboard--custom")) {
        $(element).css({ borderWidth: multiplier * 0.5 });
      }
    });

    savePedalCanvas();
  });

  $("body").on("click", ".sidebar-open", (e) => {
    $(".site-body").addClass("is-slid");
    e.preventDefault();
  });

  $("body").on("click", ".sidebar-close", (e) => {
    $(".site-body").removeClass("is-slid");
    e.preventDefault();
  });

  $("body").on("click", "#clear-canvas-confirmation", () => {
    $("#pp_canvas").empty();
    $("#clear-canvas-modal").modal("hide");
    savePedalCanvas();
  });

  $("body").on("click", "#add-pedal button", (event) => {
    const multiplier = $("#canvas-scale").val();
    const serial = GenRandom.Job();
    const selected = $("#add-pedal").find(":selected");
    const name = $(selected).text();
    const shortname = $(selected).attr("id");
    const width = $(selected).data("width");
    const height = $(selected).data("height");
    const scaledWidth = $(selected).data("width") * multiplier;
    const scaledHeight = $(selected).data("height") * multiplier;
    const i = $(selected).data("image");
    const pedal = commonTags.html`
      <div id="item-${serial}" class="item pedal ${shortname} rotate-0 ds-selectable" title="${name}" data-width="${width}" data-height="${height}" data-scale="${multiplier}">
        <div class="artwork" style="width:${scaledWidth}px;height:${scaledHeight}px; background-image:url(${pedalImagePath}${i})"></div>
        <div class="actions">
          <a class="rotate"></a>
          <a class="delete"></a>
        </div>
      </div>
    `;
    $("#pp_canvas").append(pedal);
    ds.setSelection(document.getElementById(`item-${serial}`));

    ga("send", "event", "Pedal", "added", name);
    event.preventDefault();
  });

  $("body").on("click", "#add-pedalboard button", (event) => {
    const serial = GenRandom.Job();
    const multiplier = $("#canvas-scale").val();
    const selected = $("#add-pedalboard").find(":selected");
    const name = $(selected).text();
    const shortname = $(selected).attr("id");
    const width = $(selected).data("width");
    const height = $(selected).data("height");
    const scaledWidth = $(selected).data("width") * multiplier;
    const scaledHeight = $(selected).data("height") * multiplier;
    const i = $(selected).data("image");
    const pedal = commonTags.html`
      <div id="item-${serial}" class="item pedalboard ${shortname} rotate-0 ds-selectable" title="${name}" data-width="${width}" data-height="${height}" data-scale="${multiplier}">
        <div class="artwork" style="width:${scaledWidth}px;height:${scaledHeight}px; background-image:url(${pedalboardImagePath}${i})"></div>
        <div class="actions">
          <a class="rotate"></a>
          <a class="delete"></a>
        </div>
      </div>
    `;

    $("#pp_canvas").prepend(pedal);
    ds.setSelection(document.getElementById(`item-${serial}`));

    ga("send", "event", "Pedalboard", "added", name);
    event.preventDefault();
  });

  // Activate color picker plugin on custom color field
  $(".custom-color-block").colorpicker({
    color: "#41C74D",
  });

  // Add custom pedal
  $("body").on("click", "#add-custom-pedal .btn", (event) => {
    const serial = GenRandom.Job();
    const multiplier = $("#canvas-scale").val();
    const width = $("#add-custom-pedal .custom-width").val();
    const height = $("#add-custom-pedal .custom-height").val();
    const scaledWidth = width * multiplier;
    const scaledHeight = height * multiplier;
    const dims = `${width}" x ${height}"`;
    const name = $("#add-custom-pedal .custom-name").val();
    const image = $("#add-custom-pedal .custom-color").val();
    const pedal = commonTags.html`
      <div id="item-${serial}" class="item pedal pedal--custom rotate-0 ds-selectable" style="width:${scaledWidth}px;height:${scaledHeight}px;" title="${name}" data-width="${width}" data-height="${height}" data-scale="${multiplier}">
        <div class="artwork">
          <span class="pedal__box" style="background-color:${image};"></span>
          <span class="pedal__name">${name}</span>
          <span class="pedal__jack1"></span>
          <span class="pedal__jack2"></span>
          <span class="pedal__knob1"></span>
          <span class="pedal__knob2"></span>
          <span class="pedal__led"></span>
          <span class="pedal__switch"></span>
        </div>
        <div class="actions">
          <a class="rotate"></a>
          <a class="delete"></a>
        </div>
      </div>
    `;

    $("#add-custom-pedal .invalid").removeClass("invalid");

    if (width == "" || height == "") {
      $("#add-custom-pedal .custom-height, #add-custom-pedal .custom-width").addClass("invalid");
      $("#add-custom-pedal .custom-width").focus();
    } else if (width == "") {
      $("#add-custom-pedal .custom-width").addClass("invalid").focus();
    } else if (height == "") {
      $("#add-custom-pedal .custom-height").addClass("invalid").focus();
    } else {
      console.log("add custom pedal...");
      $("#pp_canvas").append(pedal);
      ds.setSelection(document.getElementById(`item-${serial}`));

      ga("send", "event", "CustomPedal", "added", `${dims} ${name}`);
      event.preventDefault();
    }
  });

  // Add custom pedalboard
  $("body").on("click", "#add-custom-pedalboard .btn", (event) => {
    const serial = GenRandom.Job();
    const multiplier = $("#canvas-scale").val();
    const width = $("#add-custom-pedalboard .custom-width").val();
    const height = $("#add-custom-pedalboard .custom-height").val();
    const scaledWidth = width * multiplier;
    const scaledHeight = height * multiplier;

    $("#add-custom-pedalboard .invalid").removeClass("invalid");

    if (width == "" || height == "") {
      $("#add-custom-pedalboard .custom-height, #add-custom-pedalboard .custom-width").addClass("invalid");
      $("#add-custom-pedalboard .custom-width").focus();
    } else if (width == "") {
      $("#add-custom-pedalboard .custom-width").addClass("invalid").focus();
    } else if (height == "") {
      $("#add-custom-pedalboard .custom-height").addClass("invalid").focus();
    } else {
      console.log("add custom pedalboard...");
      const dims = `${width}" x ${height}"`;
      const pedalboard = commonTags.html`
        <div id="item-${serial}" class="item pedalboard pedalboard--custom rotate-0 ds-selectable" style="width:${scaledWidth}px;height:${scaledHeight}px; border-width:${multiplier / 2}px" title="Custom Pedalboard" data-width="${width}" data-height="${height}" data-scale="${multiplier}">
          <div class="artwork"></div>
          <div class="actions">
            <a class="delete"></a>
            <a class="rotate"></a>
          </div>
        </div>
      `;

      $("#pp_canvas").prepend(pedalboard);
      ds.setSelection(document.getElementById(`item-${serial}`));

      ga("send", "event", "CustomPedalboard", "added", `${dims} ${name}`);
      event.preventDefault();
    }
  });

  hotkeys("shift+u, shift+r", { keyup: true}, (event, handler) => {
    if (event.type == "keyup") {
      switch (handler.key) {
        case "shift+u":
          historyBuffer.undo();
          break;
        case "shift+r":
          historyBuffer.redo();
          break;
      }
      savePedalCanvas();
    }
  });

  hotkeys(
    "[, ], shift+d, shift+del, shift+delete, shift+backspace",
    { keyup: true },
    (event, handler) => {
      if (event.type === "keyup") {
        switch (handler.key) {
          case "shift+d":
          case "shift+del":
          case "shift+delete":
          case "shift+backspace":
            deleteSelected();
            $(".site-body > .panel").remove();
            break;
          case "[":
            $(".panel a[href='#back']").click();
            break;
          case "]":
            $(".panel a[href='#front']").click();
            break;
        }
        savePedalCanvas();
      }
    }
  );

  hotkeys("r", { keyup: true }, (event, handler) => {
    if (event.type === "keyup") {
      event.stopImmediatePropagation();
      rotateItem();
      return false;
    }
  });
}); // End Document ready

function rotateItem(targets = $("#pp_canvas .ds-selected")) {
  targets.each((i, selected) => {
    let oldClass = null;
    let newClass = null;

    function doRotation(oldClass, newClass, save = true) {
      selected.className = selected.className.replace(oldClass, newClass);
      if (save) {
        savePedalCanvas();
      }
    }

    if (selected.className.match("rotate-0") != null) {
      doRotation("rotate-0", "rotate-90");
    } else if (selected.className.match("rotate-90") != null) {
      doRotation("rotate-90", "rotate-180");
    } else if (selected.className.match("rotate-180") != null) {
      doRotation("rotate-180", "rotate-270");
    } else if (selected.className.match("rotate-270") != null) {
      doRotation("rotate-270", "rotate-360");
    } else if (selected.className.match("rotate-360") != null) {
      doRotation("rotate-360", "rotate-0", false);
      setTimeout(() => {
        doRotation("rotate-0", "rotate-90");
      }, 1);
    }
  });
}

function readyCanvas() {
  if (historyBuffer == null) {
    historyBuffer = new snapback(document.getElementById("pp_canvas"), {
      observe: {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        childList: true,
      }
    });
  }

  if (ds == null) {
    ds = new DragSelect({
      selectables: document.getElementsByClassName("item"),
      area: document.getElementById("pp_canvas"),
      multiSelectKeys: ["shift"],
      autoScrollSpeed: 0.00001,
      overflowTolerance: { x: 0, y: 0 },
      keyboardDragSpeed: 1,
    });

    ds.subscribe("callback", (callback_object) => {
      if (callback_object.isDragging) {
        if (callback_object.event.target.className == "delete") {
          deletePedal($(callback_object.event.target).parents(".item")[0]);
          callback_object.event.preventDefault();
        } else if (callback_object.event.target.className == "rotate") {
          rotateItem($(callback_object.event.target).parents(".item"));
          callback_object.event.preventDefault();
        } else {
          let initialCords = ds.getInitialCursorPositionArea();
          let currentCords = ds.getPreviousCursorPositionArea();
          if (["x", "y"].some((key) => initialCords[key] != currentCords[key])) {
            console.log("dragEnd");
            ga("send", "event", "Canvas", "moved", "dragend");
            savePedalCanvas();
          }
        }
      }
    });

    ds.clearSelection();

    savePedalCanvas();
  }
}

function savePedalCanvas() {
  console.log("Canvas Saved!");
  localStorage["pedalCanvas"] = JSON.stringify($("#pp_canvas").html());
  historyBuffer.register();
}

function saveCanvasPreview() {
  const node = $("#pp_canvas")[0];

  htmlToImage
    .toPng(node)
    .then((dataUrl) => {
      console.log(dataUrl);
      const img = new Image();
      img.src = dataUrl;
      document.body.appendChild(img);
    })
    .catch((error) => {
      console.error("oops, something went wrong!", error);
    });
}

function deletePedal(pedal) {
  $(pedal).remove();
  deselect();
  savePedalCanvas();
}

function deselect() {
  $("#pp_canvas .panel").remove();
  ds.clearSelection();
  savePedalCanvas();
}

function deleteSelected() {
  $("#pp_canvas .ds-selected").remove();
  $("#pp_canvas .panel").remove();
  savePedalCanvas();
}

window.Pedal = function (type, brand, name, width, height, image) {
  this.Type = type || "";
  this.Brand = brand || "";
  this.Name = name || "";
  this.Width = width || "";
  this.Height = height || "";
  this.Image = image || "";
};

window.GetPedalData = () => {
  $.ajax({
    url: "public/data/pedals.json",
    dataType: "text",
    type: "GET",
    success(data) {
      data = JSON.parse(data.replace(/\r\n/g, "").replace(/\t/g, ""));
      const pedals = [];
      for (const pedal in data) {
        pedals.push(
          new Pedal(
            data[pedal].Type || "",
            data[pedal].Brand || "",
            data[pedal].Name || "",
            data[pedal].Width || "",
            data[pedal].Height || "",
            data[pedal].Image || ""
          )
        );
      }
      pedals.sort((a, b) => {
        if (`${a.Brand}-${a.Name}` < `${b.Brand}-${b.Name}`) {
          return -1;
        } else if (`${b.Brand}-${b.Name}` < `${a.Brand}-${a.Name}`) {
          return 1;
        } else {
          return 0;
        }
      });
      pedals.forEach(RenderPedals);
      listPedals(pedals);
    },
  });
};

window.RenderPedals = (pedals) => {
  const { Type, Brand, Name, Width, Height, Image } = pedals;
  const option = $("<option>", {
    text: `${Brand} ${Name}`,
    data: {
      width: Width,
      height: Height,
      image: Image,
    },
  });
  if ($("optgroup").is(`[label="${Brand}"]`)) {
    $(`optgroup[label="${Brand}"]`).append(option);
  } else {
    $("<optgroup>", {
      label: Brand,
      html: option,
    }).appendTo(".pedal-list");
  }
};

window.PedalBoard = function (brand, name, width, height, image) {
  this.Brand = brand || "";
  this.Name = name || "";
  this.Width = width || "";
  this.Height = height || "";
  this.Image = image || "";
};

window.GetPedalBoardData = () => {
  $.ajax({
    url: "public/data/pedalboards.json",
    dataType: "text",
    type: "GET",
    success(data) {
      data = JSON.parse(data.replace(/\r\n/g, "").replace(/\t/g, ""));
      const pedalboards = [];
      for (const pedalboard in data) {
        pedalboards.push(
          new PedalBoard(
            data[pedalboard].Brand || "",
            data[pedalboard].Name || "",
            data[pedalboard].Width || "",
            data[pedalboard].Height || "",
            data[pedalboard].Image || ""
          )
        );
      }
      pedalboards.sort((a, b) => {
        if (`${a.Brand}-${a.Name}` < `${b.Brand}-${b.Name}`) {
          return -1;
        } else if (`${b.Brand}-${b.Name}` < `${a.Brand}-${a.Name}`) {
          return 1;
        } else {
          return 0;
        }
      });
      RenderPedalBoards(pedalboards);
    },
  });
};

window.RenderPedalBoards = (pedalboards) => {
  for (const i in pedalboards) {
    const $pedalboard = $(`<option>${pedalboards[i].Brand} ${pedalboards[i].Name}</option>`);
    $pedalboard.data("width", pedalboards[i].Width);
    $pedalboard.data("height", pedalboards[i].Height);
    $pedalboard.data("height", pedalboards[i].Height);
    $pedalboard.data("image", pedalboards[i].Image);
    $pedalboard.appendTo(".pedalboard-list");
  }
};

window.listPedals = (pedals) => {
  if ($("#list-pedals").length) {
    for (const i in pedals) {
      multiplier = 40;
      Width = pedals[i].Width * multiplier;
      Height = pedals[i].Height * multiplier;

      const $pedalListing = $(
        commonTags.html`
          <div class="pedal-listing">
            <img src="${pedalImagePath}${pedals[i].Image}" alt="${pedals[i].Brand} ${pedals[i].Name}" width="${Width}" height="${Height}"/>
            <p class="pedal-brand">${pedals[i].Brand}</p>
            <p class="pedal-name">${pedals[i].Name}</p>
          </div>
        `
      );
      $pedalListing.appendTo("#list-pedals");
    }
  }
};

var GenRandom = {
  Stored: [],
  Job() {
    const newId = Date.now().toString().substr(3);
    if (!this.Check(newId)) {
      this.Stored.push(newId);
      return newId;
    }
    return this.Job();
  },
  Check(id) {
    for (let i = 0; i < this.Stored.length; i++) {
      if (this.Stored[i] == id) return true;
    }
    return false;
  },
};

$("body").on("click", ".item", function (e) {
  const pedal = $(this);
  const id = $(this).attr("id");
  const pedalName = $(this).attr("title");
  const width = $(this).attr("data-width");
  const height = $(this).attr("data-height");
  const markup = commonTags.html`
    <div class="panel" data-id="#${id}">
      <div class="panel__name">
        ${pedalName}
        <br>
        <span class="panel__dimensions">(${width} x ${height})</span>
      </div>
      <a href="#rotate" class="panel__action">Rotate <i>R</i></a>
      <a href="#front" class="panel__action">Move Front <i>]</i></a>
      <a href="#back" class="panel__action">Move Back <i>[</i></a>
      <a href="#delete" class="panel__action">Delete <i>shift+D</i></a>
    </div>
  `;

  // reset stuff
  $(".panel").remove();

  $("#pp_canvas").after(markup);

  // Prevent bubble up to .canvas
  e.stopPropagation();
});

$("body").on("click", 'a[href="#rotate"]', function (e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const id = $(this).parents(".panel").data("id");
  rotateItem($(id));
});

$("body").on("click", 'a[href="#delete"]', function () {
  const id = $(this).parents(".panel").data("id");
  $(id).remove();
  $(".panel").remove();
  savePedalCanvas();
});

$("body").on("click", 'a[href="#front"]', function (e) {
  e.stopImmediatePropagation();
  const id = $(this).parents(".panel").data("id");
  $(id).next().insertBefore(id);
  savePedalCanvas();
  e.stopPropagation();
});

$("body").on("click", 'a[href="#back"]', function (e) {
  e.stopImmediatePropagation();
  const id = $(this).parents(".panel").data("id");
  $(id).prev().insertAfter(id);
  savePedalCanvas();
  e.stopPropagation();
});

$("body").click(() => {
  // reset stuff
  $(".panel").remove();
});
