// The default options of the grid accordion
const defaults = {
    width: 800,
    height: 400,
    responsive: true,
    responsiveMode: 'auto',
    aspectRatio: -1,
    orientation: 'horizontal',
    startPanel: -1,
    rows: 3,
    columns: 4,
    openedPanelWidth: 'max',
    openedPanelHeight: 'max',
    maxOpenedPanelWidth: '70%',
    maxOpenedPanelHeight: '70%',
    openPanelOn: 'hover',
    closePanelsOnMouseOut: true,
    mouseDelay: 200,
    panelDistance: 10,
    openPanelDuration: 700,
    closePanelDuration: 700,
    pageScrollDuration: 500,
    pageScrollEasing: 'swing',
    breakpoints: null,
    startPage: 0,
    shadow: false,
    shuffle: false,

    // The list of add-ons that will be initialized when the accordion is initialized.
    addOns: []
};

export default defaults;