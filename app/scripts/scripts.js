const pedalImagePath = "public/images/pedals/";
const pedalboardImagePath = "public/images/pedalboards/";

let ds = null;
let historyBuffer = null;

class Pedal {
  constructor({ brand, name, width, height, image }) {
    this.brand = brand || "";
    this.name = name || "";
    this.width = width || "";
    this.height = height || "";
    this.image = image || "";
  }
}

class PedalBoard {
  constructor({ brand, name, width, height, image }) {
    this.brand = brand || "";
    this.name = name || "";
    this.width = width || "";
    this.height = height || "";
    this.image = image || "";
  }
}

const collectionMap = {
  pedals: {
    className: Pedal,
    imageRoute: pedalImagePath,
    singular: "pedal",
  },
  pedalboards: {
    className: PedalBoard,
    imageRoute: pedalboardImagePath,
    singular: "pedalboard",
  },
};

$(document).ready(() => {
  // Populate Pedalboards and Pedals lists
  getCollection("pedals");
  getCollection("pedalboards");

  // Make lists searchable
  $(".pedal-list").select2({
    placeholder: "Select a pedal",
    width: "style",
  });

  $(".pedal-list").on("select2:select", (e) => {
    $("#add-selected-pedal").trigger("click");
    $(this).trigger("change").trigger("focus");
  });

  $(".pedalboard-list").select2({
    placeholder: "Select a pedalboard",
    width: "style",
  });

  $(".pedalboard-list").on("select2:select", (e) => {
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
  $("#canvas-scale").on("change", () => {
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
    addCollectionItem("pedals");
    event.preventDefault();
  });

  $("body").on("click", "#add-pedalboard button", (event) => {
    addCollectionItem("pedalboards");
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

  hotkeys(
    "shift+u, shift+r",
    { keyup: true },
    (event, handler) => {
      if (event.type === "keyup") {
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
      return false;
    }
  );

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
            // $(".site-body > .panel").remove();
            break;
          case "[":
            $(".panel a[href='#back']").trigger("click");
            break;
          case "]":
            $(".panel a[href='#front']").trigger("click");
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

const rotateItem = (targets = $("#pp_canvas .ds-selected")) => {
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

const readyCanvas = () => {
  if (historyBuffer == null) {
    historyBuffer = new snapback(document.getElementById("pp_canvas"), {
      observe: {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        childList: true,
      },
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

    ds.subscribe("elementselect", (callback_object) => {
      addToPanel(callback_object.item);
    });

    ds.subscribe("elementunselect", (callback_object) => {
      removeFromPanel(callback_object.item);
    });

    ds.clearSelection();

    savePedalCanvas();
  }
}

const savePedalCanvas = throttleDebounce.debounce(400, () => {
  console.log("Canvas Saved!");
  localStorage["pedalCanvas"] = JSON.stringify($("#pp_canvas").html());
  historyBuffer.register();
});

const saveCanvasPreview = () => {
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

const addCollectionItem = (collection) => {
  if (!collectionMap.hasOwnProperty(collection)) {
    return false;
  }

  const itemType = collectionMap[collection]["singular"];
  const serial = GenRandom.Job();
  const multiplier = $("#canvas-scale").val();
  const selected = $(`#add-${itemType}`).find(":selected");
  const name = $(selected).text();
  const shortname = $(selected).attr("id");
  const width = $(selected).data("width");
  const height = $(selected).data("height");
  const scaledWidth = $(selected).data("width") * multiplier;
  const scaledHeight = $(selected).data("height") * multiplier;
  const i = $(selected).data("image");
  const item = commonTags.html`
    <div id="item-${serial}" class="item ${itemType} ${shortname} rotate-0 ds-selectable" title="${name}" data-width="${width}" data-height="${height}" data-scale="${multiplier}">
      <div class="artwork" style="width:${scaledWidth}px;height:${scaledHeight}px; background-image:url(${collectionMap[collection]["imageRoute"]}${i})"></div>
      <div class="actions">
        <a class="rotate"></a>
        <a class="delete"></a>
      </div>
    </div>
  `;

  $("#pp_canvas").prepend(item);
  ds.setSelection(document.getElementById(`item-${serial}`));

  ga("send", "event", `${itemType}`, "added", name);
}

const deletePedal = (pedal) => {
  $(pedal).remove();
  deselect();
  savePedalCanvas();
}

const deselect = () => {
  // $("#pp_canvas .panel").remove();
  ds.clearSelection();
  savePedalCanvas();
}

const deleteSelected = () => {
  $("#pp_canvas .ds-selected").remove();
  // $("#pp_canvas .panel").remove();
  savePedalCanvas();
}

const getCollection = (collection) => {
  if (!collectionMap.hasOwnProperty(collection)) {
    return false;
  }

  $.ajax({
    url: `public/data/${collection}.json`,
    dataType: "text",
    type: "GET",
    success(data) {
      data = JSON.parse(data.replace(/\r\n/g, "").replace(/\t/g, ""));
      let collectionItems = data.map((item) => new collectionMap[collection]["className"](item));
      collectionItems.sort((a, b) => {
        if (`${a.brand}-${a.name}` < `${b.brand}-${b.name}`) {
          return -1;
        } else if (`${b.brand}-${b.name}` < `${a.brand}-${a.name}`) {
          return 1;
        } else {
          return 0;
        }
      });
      collectionItems.forEach((item) => {
        renderCollectionItem(collectionMap[collection]["singular"], item);
      });
    },
  });
}

const renderCollectionItem = (itemType, { brand, name, width, height, image }) => {
  const option = $("<option>", {
    text: `${brand} ${name}`,
    data: {
      width,
      height,
      image,
    },
  });
  if ($(`.${itemType}-list optgroup[label="${brand}"]`).length > 0) {
    $(`.${itemType}-list optgroup[label="${brand}"]`).append(option);
  } else {
    $("<optgroup>", {
      label: brand,
      html: option,
    }).appendTo(`.${itemType}-list`);
  }
}

const addToPanel = (item) => {
  const { id, title: itemName } = item;
  const width = item.getAttribute("data-width");
  const height = item.getAttribute("data-height");
  let ids = document.getElementById("pp_panel").getAttribute("data-ids") || "";
  ids = ids
    .split(",")
    .concat(id)
    .filter((el) => el != "")
    .join(",");

  const markup = commonTags.html`
    <div class="panel__name" id="panel__id_${id}">
      ${itemName}
      <br>
      <span class="panel__dimensions">(${width} x ${height})</span>
    </div>
  `;

  $("#pp_panel")
    .attr("data-ids", ids)
    .prepend(markup)
    .removeClass("hide");
}

const removeFromPanel = (item) => {
  let ids = document.getElementById("pp_panel").getAttribute("data-ids") || "";
  ids = ids.split(",").filter((el) => el != "" && el != item.id);

  if (ids.length == 0) {
    $("#pp_panel").attr("data-ids", "").addClass("hide");
  } else {
    $("#pp_panel").attr("data-ids", ids.join(","));
  }

  document.getElementById(`panel__id_${item.id}`).remove();
}

const GenRandom = {
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
}

$("body").on("click", 'a[href="#rotate"]', (event) => {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  rotateItem();
});

$("body").on("click", 'a[href="#delete"]', (event) => {
  event.preventDefault();
  deleteSelected();
  // $(".panel").remove();
  savePedalCanvas();
});

$("body").on("click", 'a[href="#front"]', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  let ids = $(event.currentTarget).parents(".panel").attr("data-ids") || "";
  ids = ids.split(",")

  ids.sort((a, b) => {
    return $("#pp_canvas .item").index(document.getElementById(b)) - $("#pp_canvas .item").index(document.getElementById(a));
  });

  let maxIndex = $("#pp_canvas .item").index(document.getElementById(ids[0]));
  maxIndex = Math.min(maxIndex + 1, $("#pp_canvas .item").length);

  ids.forEach((el, index) => {
    $(`#${el}`).insertAfter($("#pp_canvas .item").eq(maxIndex - index));
  });

  savePedalCanvas();
  event.stopPropagation();
});

$("body").on("click", 'a[href="#back"]', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  let ids = $(event.currentTarget).parents(".panel").attr("data-ids") || "";
  ids = ids.split(",");

  ids.sort((a, b) => {
    return (
      $("#pp_canvas .item").index(document.getElementById(a)) -
      $("#pp_canvas .item").index(document.getElementById(b))
    );
  });

  let minIndex = $("#pp_canvas .item").index(document.getElementById(ids[0]));
  minIndex = Math.max(minIndex - 1, 0);

  ids.forEach((el, index) => {
    $(`#${el}`).insertBefore($("#pp_canvas .item").eq(minIndex + index));
  });

  savePedalCanvas();
  event.stopPropagation();
});

$("body").on("click", () => {
  // reset stuff
  // $(".panel").remove();
});
