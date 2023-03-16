import defaults from './grid-accordion-defaults.js';
import { resolveUnit } from '../helpers/util.js';
import GridAccordionPanel from './grid-accordion-panel.js';
import CustomEventTarget from '../helpers/custom-event-target.js';
import WindowResizeHandler from '../helpers/window-resize-handler.js';
import AddOnsManager from '../add-ons/add-ons-manager.js';

class GridAccordion extends CustomEventTarget {

    // The namespace to be used when adding event listeners
    namespace = 'gridaccordion';

    // Holds the final settings of the accordion after merging the specified
    // ones with the default ones.
    settings = {};

    // Selector for the main element of the accordion
    selector;

    // reference to main accordion element
    accordionEl = null;

    // reference to the container of the panels
    panelsEl = null;

    // reference to the container that will mask the panels
    panelsMaskEl = null;

    // the index of the currently opened panel ( starts with 0 )
    currentIndex = -1;

    // the index of the current page
    currentPage = 0;

    // the computed number of columns and rows
    columns = 0;
    rows = 0;

    // the width and height, in pixels, of the accordion
    totalWidth = 0;
    totalHeight = 0;

    // the width or height ( depending on orientation ) of the panels' container
    totalPanelsSize = 0;

    // the computed width and height, in pixels, of the opened panel
    computedOpenedPanelWidth = 0;
    computedOpenedPanelHeight = 0;

    // the computed maximum allowed width and height, in pixels, of the opened panel
    maxComputedOpenedPanelWidth= 0;
    maxComputedOpenedPanelHeight = 0;

    // the width and height, in pixels, of the collapsed panels
    collapsedPanelWidth = 0;
    collapsedPanelHeight = 0;

    // the width and height, in pixels, of the closed panels
    closedPanelWidth = 0;
    closedPanelHeight = 0;

    // the distance, in pixels, between the accordion's panels
    computedPanelDistance = 0;

    // array that contains the GridAccordionPanel objects
    panels = [];

    // timer used for delaying the opening of the panel on mouse hover
    mouseDelayTimer = 0;

    // simple objects to be used for animation
    openPanelAnimation = {};
    closePanelsAnimation = {};

    // keeps a reference to the previous number of columns and rows
    previousColumns = -1;
    previousRows = -1;

    // indicates whether the accordion is currently scrolling
    isPageScrolling = false;

    // keeps a reference to the ratio between the size actual size of the accordion and the set size
    autoResponsiveRatio = 1;

    // stores all panels that contain images which are in the loading process
    loadingPanels = [];

    // Stores references the event handlers in pairs containing the event identifier and the event handler
    // in order to be able to retrieve them when they need to be removed
    eventHandlerReferences = {};

    // Reference to the WindowResizeHandler instance
    windowResizeHandler;

    // Reference to the AddOnsManager instance
    addOnsManager;

    constructor( selector, options = null ) {
        super();

        this.selector = selector;

        this.settings = options !== null ? { ...defaults, ...options } : { ...defaults };

        this.addOnsManager = new AddOnsManager( this, this.settings.addOns );
        this.addOnsManager.init();

        this.init();
    }

    // The starting place for the grid accordion
    init() {
        this.dispatchEvent( 'beforeInit' );

        this.accordionEl = document.querySelector( this.selector );

        // Remove the 'ga-no-js' when the accordion's JavaScript code starts running
        this.accordionEl.classList.remove( 'ga-no-js' );

        // Set up the panels containers
        // grid-accordion > ga-mask > ga-panels > ga-panel
        this.panelsMaskEl = document.createElement( 'div' );
        this.panelsMaskEl.classList.add( 'ga-mask' );
        this.accordionEl.appendChild( this.panelsMaskEl );

        this.panelsContainerEl = this.accordionEl.getElementsByClassName( 'ga-panels' )[ 0 ];

        if ( this.accordionEl.getElementsByClassName( 'ga-panels' ).length === 0 ) {
            this.panelsContainerEl = document.createElement( 'div' );
            this.panelsContainerEl.classList.add( 'ga-panels' );
        }

        this.panelsMaskEl.appendChild( this.panelsContainerEl );

        if ( this.settings.shuffle === true ) {
            const panels = Array.from( this.panelsContainerEl.getElementsByClassName( 'ga-panel' ) );
            const shuffledPanels = [ ...panels ];

            for ( let k = shuffledPanels.length - 1; k > 0; k-- ) {
                let l = Math.floor( Math.random() * ( k + 1 ) );
                let temp = shuffledPanels[ k ];

                shuffledPanels[ k ] = shuffledPanels[ l ];
                shuffledPanels[ l ] = temp;
            }

            this.panelsContainerEl.replaceChildren( ...shuffledPanels );
        }

        // set a panel to be opened from the start
        this.currentIndex = this.settings.startPanel;

        if ( this.currentIndex === -1 ) {
            this.accordionEl.classList.add( 'ga-closed' );
        } else {
            this.accordionEl.classList.add( 'ga-opened' );
        }

        // if a panels was not set to be opened but a page was specified,
        // set that page index to be opened
        if ( this.settings.startPage !== -1 ) {
            this.currentPage = this.settings.startPage;
        }
        
        this.windowResizeHandler = new WindowResizeHandler();
        this.windowResizeHandler.addEventListener( 'resize', () => {
            this.resize();
        } );

        this.update();

        // if there is a panel opened at start handle that panel as if it was manually opened
        if ( this.currentIndex !== -1 ) {
            this.accordionEl.getElementsByClassName( 'ga-panel' )[ this.currentIndex ].classList.add( 'ga-opened' );

            this.dispatchEvent( 'panelOpen', { index: this.currentIndex, previousIndex: -1 } );
        }

        // listen for 'mouseenter' events
        this.accordionEl.addEventListener( 'mouseenter', this.eventHandlerReferences[ 'mouseenter.accordion' ] = () => {
            this.dispatchEvent( 'accordionMouseOver' );
        } );

        // listen for 'mouseleave' events
        this.accordionEl.addEventListener( 'mouseleave', this.eventHandlerReferences[ 'mouseleave.accordion' ] = () => {
            clearTimeout( this.mouseDelayTimer );

            // close the panels
            if ( this.settings.closePanelsOnMouseOut === true ) {
                this.closePanels();
            }

            this.dispatchEvent( 'accordionMouseOut' );
        } );

        this.dispatchEvent( 'init' );
    }

    update() {
        this.dispatchEvent( 'beforeUpdate' );

        // add a class to the accordion based on the orientation
        // to be used in CSS
        if ( this.settings.orientation === 'horizontal' ) {
            this.accordionEl.classList.remove( 'ga-vertical' );
            this.accordionEl.classList.add( 'ga-horizontal' );
        } else if ( this.settings.orientation === 'vertical' ) {
            this.accordionEl.classList.remove( 'ga-horizontal' );
            this.accordionEl.classList.add( 'ga-vertical' );
        }

        // clear inline size of the background images because the orientation might have changes
        [ ...Array.from( this.accordionEl.getElementsByClassName( 'ga-background' ) ),
            ...Array.from( this.accordionEl.getElementsByClassName( 'ga-background-opened' ) ) ].forEach( ( imageEl ) => {
            imageEl.style.removeProperty( 'width' );
            imageEl.style.removeProperty( 'height' );
        } );

        // update panels
        this.updatePanels();

        // calculate the actual number of rows and columns
        this.columns = this.settings.columns;
        this.rows = this.settings.rows;

        if ( this.settings.columns === -1 && this.settings.rows === -1 ) {
            this.columns = 4;
            this.rows = 3;
        } else if ( this.settings.columns === -1 ) {
            this.columns = Math.ceil( this.getTotalPanels() / this.settings.rows );
            this.rows = this.settings.rows;
        } else if ( this.settings.rows === -1 ) {
            this.columns = this.settings.columns;
            this.rows = Math.ceil( this.getTotalPanels() / this.settings.columns );
        }

        // if the number of rows or columns has changed, update the current page to reflect
        // the same relative position of the panels
        if ( this.settings.columns === -1 || this.settings.rows === -1 ) {
            this.currentPage = 0;
        } else if ( this.currentIndex !== -1 ) {
            this.currentPage = Math.floor( this.currentIndex / ( this.settings.columns * this.settings.rows ) );
        } else if ( ( this.settings.columns !== this.previousColumns && this.previousColumns !== -1 ) || ( this.settings.rows !== this.previousRows && this.previousRows !== -1 ) ) {
            let correctPage = Math.min( Math.round( ( this.currentPage * ( this.previousColumns * this.previousRows ) ) / ( this.settings.columns * this.settings.rows ) ), this.getTotalPages() - 1 );

            if ( this.currentPage !== correctPage ) {
                this.currentPage = correctPage;
            }
        }

        // reset the panels' container position
        this.panelsContainerEl.removeAttribute( 'style' );

        // set the size of the accordion
        this.resize();

        // fire the update event
        this.dispatchEvent( 'update' );
    }

    /*
        Called when the accordion needs to resize 
    */
    resize() {
        this.dispatchEvent( 'beforeResize' );

        this.panelsMaskEl.removeAttribute( 'style' );

        // prepare the accordion for responsiveness
        if ( this.settings.responsive === true ) {
            // if the accordion is responsive set the width to 100% and use
            // the specified width and height as a max-width and max-height
            this.accordionEl.style.width = '100%';
            this.accordionEl.style.height = resolveUnit( this.settings.height );
            this.accordionEl.style.maxWidth = resolveUnit( this.settings.width );
            this.accordionEl.style.maxHeight = resolveUnit( this.settings.height );

            // if an aspect ratio was not specified, set the aspect ratio
            // based on the specified width and height
            if ( this.settings.aspectRatio === -1 ) {
                this.settings.aspectRatio = this.settings.width / this.settings.height;
            }

            this.accordionEl.style.height = resolveUnit( this.accordionEl.clientWidth / this.settings.aspectRatio );

            if ( this.settings.responsiveMode === 'auto' ) {
                // get the accordion's size ratio based on the set size and the actual size
                this.autoResponsiveRatio = this.accordionEl.clientWidth / this.settings.width;

                this.panelsMaskEl.style.width = resolveUnit( this.settings.width );

                if ( isNaN( this.settings.height ) ) {
                    this.panelsMaskEl.style.height = resolveUnit( Math.min( this.settings.width / this.settings.aspectRatio, parseInt( this.settings.height, 10 ) / 100 * window.innerHeight ) );
                } else {
                    this.panelsMaskEl.style.height = resolveUnit( Math.min( this.settings.width / this.settings.aspectRatio, this.settings.height ) );
                }

                // scale the mask container based on the current ratio
                if ( this.autoResponsiveRatio < 1 ) {
                    this.panelsMaskEl.style.transform = `scaleX( ${ this.autoResponsiveRatio } ) scaleY( ${ this.autoResponsiveRatio } )`;
                    this.panelsMaskEl.style.transformOrigin = 'top left';
                } else {
                    this.panelsMaskEl.style.removeProperty( 'transform' );
                    this.panelsMaskEl.style.removeProperty( 'transform-origin' );
                }

                this.totalWidth = this.panelsMaskEl.clientWidth;
                this.totalHeight = this.panelsMaskEl.clientHeight;
            } else {
                this.totalWidth = this.accordionEl.clientWidth;
                this.totalHeight = this.accordionEl.clientHeight;
            }
        } else {
            this.accordionEl.style.width = resolveUnit( this.settings.width );
            this.accordionEl.style.height = resolveUnit( this.settings.height );
            this.accordionEl.style.removeProperty( 'max-width' );
            this.accordionEl.style.removeProperty( 'max-height' );
            
            this.totalWidth = this.accordionEl.clientWidth;
            this.totalHeight = this.accordionEl.clientHeight;
        }

        // reset the list of panels that we are tracking
        this.loadingPanels.length = 0;

        // set the initial computedPanelDistance to the value defined in the options
        this.computedPanelDistance = this.settings.panelDistance;

        // parse computedPanelDistance and set it to a pixel value
        if ( typeof this.computedPanelDistance === 'string' ) {
            if ( this.computedPanelDistance.indexOf( '%' ) !== -1 ) {
                this.computedPanelDistance = this.totalWidth * ( parseInt( this.computedPanelDistance, 10 ) / 100 );
            } else if ( this.computedPanelDistance.indexOf( 'px' ) !== -1 ) {
                this.computedPanelDistance = parseInt( this.computedPanelDistance, 10 );
            }
        }

        // set the width and height, in pixels, of the closed panels
        this.closedPanelWidth = ( this.totalWidth - ( this.columns - 1 ) * this.computedPanelDistance ) / this.columns;
        this.closedPanelHeight = ( this.totalHeight - ( this.rows - 1 ) * this.computedPanelDistance ) / this.rows;

        // set the initial computedOpenedPanelWidth to the value defined in the options
        this.computedOpenedPanelWidth = this.settings.openedPanelWidth;

        // parse maxComputedOpenedPanelWidth and set it to a pixel value
        this.maxComputedOpenedPanelWidth = this.settings.maxOpenedPanelWidth;

        if ( typeof this.maxComputedOpenedPanelWidth === 'string' ) {
            if ( this.maxComputedOpenedPanelWidth.indexOf( '%' ) !== -1 ) {
                this.maxComputedOpenedPanelWidth = this.totalWidth * ( parseInt( this.maxComputedOpenedPanelWidth, 10 )/ 100 );
            } else if ( this.maxComputedOpenedPanelWidth.indexOf( 'px' ) !== -1 ) {
                this.maxComputedOpenedPanelWidth = parseInt( this.maxComputedOpenedPanelWidth, 10 );
            }
        }

        // set the initial computedOpenedPanelHeight to the value defined in the options
        this.computedOpenedPanelHeight = this.settings.openedPanelHeight;

        // parse maxComputedOpenedPanelHeight and set it to a pixel value
        this.maxComputedOpenedPanelHeight = this.settings.maxOpenedPanelHeight;

        if ( typeof this.maxComputedOpenedPanelHeight === 'string' ) {
            if ( this.maxComputedOpenedPanelHeight.indexOf( '%' ) !== -1 ) {
                this.maxComputedOpenedPanelHeight = this.totalHeight * ( parseInt( this.maxComputedOpenedPanelHeight, 10 )/ 100 );
            } else if ( this.maxComputedOpenedPanelHeight.indexOf( 'px' ) !== -1 ) {
                this.maxComputedOpenedPanelHeight = parseInt( this.maxComputedOpenedPanelHeight, 10 );
            }
        }

        // parse computedOpenedPanelWidth and set it to a pixel value
        if ( typeof this.computedOpenedPanelWidth === 'string' ) {
            if ( this.computedOpenedPanelWidth.indexOf( '%' ) !== -1 ) {
                this.computedOpenedPanelWidth = this.totalWidth * ( parseInt( this.computedOpenedPanelWidth, 10 )/ 100 );
            } else if ( this.computedOpenedPanelWidth.indexOf( 'px' ) !== -1 ) {
                this.computedOpenedPanelWidth = parseInt( this.computedOpenedPanelWidth, 10 );
            } else if ( this.computedOpenedPanelWidth === 'max' && this.currentIndex !== -1 ) {
                const openedPanelContentWidth = this.getPanelAt( this.currentIndex ).getContentSize();

                if ( openedPanelContentWidth === 'loading' ) {
                    this.computedOpenedPanelWidth = this.closedPanelWidth;
                } else {
                    this.computedOpenedPanelWidth = Math.min( openedPanelContentWidth.width, this.maxComputedOpenedPanelWidth );
                }
            }
        }

        // parse computedOpenedPanelHeight and set it to a pixel value
        if ( typeof this.computedOpenedPanelHeight === 'string' ) {
            if ( this.computedOpenedPanelHeight.indexOf( '%' ) !== -1 ) {
                this.computedOpenedPanelHeight = this.totalHeight * ( parseInt( this.computedOpenedPanelHeight, 10 )/ 100 );
            } else if ( this.computedOpenedPanelHeight.indexOf( 'px' ) !== -1 ) {
                this.computedOpenedPanelHeight = parseInt( this.computedOpenedPanelHeight, 10 );
            } else if ( this.computedOpenedPanelHeight === 'max' && this.currentIndex !== -1 ) {
                const openedPanelContentHeight = this.getPanelAt( this.currentIndex ).getContentSize();

                if ( openedPanelContentHeight === 'loading' ) {
                    this.computedOpenedPanelHeight = this.closedPanelHeight;
                } else {
                    this.computedOpenedPanelHeight = Math.min( openedPanelContentHeight.height, this.maxComputedOpenedPanelHeight );
                }
            }
        }

        // calculate the minimum width between the panels opened vertically and the minimum height between the panels opened horizontally
        if ( this.settings.openedPanelWidth === 'auto' || this.settings.openedPanelHeight === 'auto' ) {
            const minSize = this.getMinSize( this.getFirstPanelFromPage(), this.getLastPanelFromPage() ),
                maxWidth = minSize.width,
                maxHeight = minSize.height;
                
            if ( this.settings.openedPanelWidth === 'auto' ) {
                this.computedOpenedPanelWidth = maxWidth;
            }

            if ( this.settings.openedPanelHeight === 'auto' ) {
                this.computedOpenedPanelHeight = maxHeight;
            }
        }

        // adjust the maximum width and height of the images
        Array.from( document.getElementsByClassName( 'ga-background' ) ).forEach(( imageEl ) => {
            imageEl.style.maxWidth = resolveUnit( this.maxComputedOpenedPanelWidth );
            imageEl.style.maxHeight = resolveUnit( this.maxComputedOpenedPanelHeight );
        });

        Array.from( document.getElementsByClassName( 'ga-background-opened' ) ).forEach(( imageEl ) => {
            imageEl.style.maxWidth = resolveUnit( this.maxComputedOpenedPanelWidth );
            imageEl.style.maxHeight = resolveUnit( this.maxComputedOpenedPanelHeight );
        });

        // set the width and height, in pixels, of the collapsed panels
        this.collapsedPanelWidth = ( this.totalWidth - this.computedOpenedPanelWidth - ( this.columns - 1 ) * this.computedPanelDistance ) / ( this.columns - 1 );
        this.collapsedPanelHeight = ( this.totalHeight - this.computedOpenedPanelHeight - ( this.rows - 1 ) * this.computedPanelDistance ) / ( this.rows - 1 );

        // round the values
        this.computedOpenedPanelWidth = Math.floor( this.computedOpenedPanelWidth );
        this.computedOpenedPanelHeight = Math.floor( this.computedOpenedPanelHeight );
        this.collapsedPanelWidth = Math.floor( this.collapsedPanelWidth );
        this.collapsedPanelHeight = Math.floor( this.collapsedPanelHeight );
        this.closedPanelWidth = Math.floor( this.closedPanelWidth );
        this.closedPanelHeight = Math.floor( this.closedPanelHeight );

        // reset the accordion's size so that the panels fit exactly inside if their size and position are rounded
        this.totalWidth = this.closedPanelWidth * this.columns + this.computedPanelDistance * ( this.columns - 1 );
        this.totalHeight = this.closedPanelHeight * this.rows + this.computedPanelDistance * ( this.rows - 1 );

        if ( this.settings.responsiveMode === 'custom' || this.settings.responsive === false ) {
            this.accordionEl.style.width = resolveUnit( this.totalWidth );
            this.accordionEl.style.height = resolveUnit( this.totalHeight );
        } else {
            this.accordionEl.style.width = resolveUnit( this.totalWidth * this.autoResponsiveRatio );
            this.accordionEl.style.height = resolveUnit( this.totalHeight * this.autoResponsiveRatio );
            this.panelsMaskEl.style.width = resolveUnit( this.totalWidth );
            this.panelsMaskEl.style.height = resolveUnit( this.totalHeight );
        }

        // get the total width and height of the panels' container
        if ( this.settings.orientation === 'horizontal' ) {
            this.totalPanelsSize = this.totalWidth * this.getTotalPages() + this.computedPanelDistance * ( this.getTotalPages() - 1 );
            this.panelsContainerEl.style.width = resolveUnit( this.totalPanelsSize );
        } else {
            this.totalPanelsSize = this.totalHeight * this.getTotalPages() + this.computedPanelDistance * ( this.getTotalPages() - 1 );
            this.panelsContainerEl.style.height = resolveUnit( this.totalPanelsSize );
        }

        // if there are multiple pages, set the correct position of the panels' container
        if ( this.getTotalPages() > 1 ) {
            const positionProperty = this.settings.orientation === 'horizontal' ? 'left' : 'top',
                targetPosition = - ( ( this.settings.orientation === 'horizontal' ? this.totalWidth : this.totalHeight ) + this.computedPanelDistance ) * this.currentPage;

            this.panelsContainerEl.style[ positionProperty ] = resolveUnit( targetPosition );
        }

        // set the position and size of each panel
        this.panels.forEach( ( panel, index ) => {
            let leftPosition, topPosition, width, height, horizontalIndex, verticalIndex;

            // calculate the position of the panels
            if ( this.settings.orientation === 'horizontal' ) {
                horizontalIndex = index % this.columns + ( this.columns * Math.floor( index / ( this.rows * this.columns ) ) );
                verticalIndex = Math.floor( index / this.columns ) - ( this.rows * Math.floor( index / ( this.rows * this.columns ) ) );

                if ( this.currentIndex !== -1 && Math.floor( index / ( this.rows * this.columns ) ) === this.currentPage ) {
                    leftPosition = this.currentPage * ( this.totalWidth + this.computedPanelDistance ) +
                                    ( horizontalIndex - ( this.currentPage * ( this.columns ) ) ) * ( this.collapsedPanelWidth + this.computedPanelDistance ) +
                                    ( index % this.columns > this.currentIndex % this.columns ? this.computedOpenedPanelWidth - this.collapsedPanelWidth : 0 );
                    
                    topPosition = verticalIndex * ( this.collapsedPanelHeight + this.computedPanelDistance ) +
                                    ( Math.floor( index / this.columns ) > Math.floor( this.currentIndex / this.columns ) ? this.computedOpenedPanelHeight - this.collapsedPanelHeight : 0 );
                } else {
                    leftPosition = horizontalIndex * ( this.closedPanelWidth + this.computedPanelDistance );
                    topPosition = verticalIndex * ( this.closedPanelHeight + this.computedPanelDistance );
                }
            } else {
                horizontalIndex = index % this.columns;
                verticalIndex = Math.floor( index / this.columns );

                if ( this.currentIndex !== -1 && ( Math.floor( index / ( this.rows * this.columns ) ) === this.currentPage ) ) {
                    leftPosition = horizontalIndex * ( this.collapsedPanelWidth + this.computedPanelDistance ) +
                                    ( index % this.columns > this.currentIndex % this.columns ? this.computedOpenedPanelWidth - this.collapsedPanelWidth : 0 );

                    topPosition = this.currentPage * ( this.totalHeight + this.computedPanelDistance ) +
                                    ( verticalIndex - ( this.currentPage * this.rows ) ) * ( this.collapsedPanelHeight + this.computedPanelDistance ) +
                                    ( Math.floor( index / this.columns ) > Math.floor( this.currentIndex / this.columns ) ? this.computedOpenedPanelHeight - this.collapsedPanelHeight : 0 );
                } else {
                    leftPosition = horizontalIndex * ( this.closedPanelWidth + this.computedPanelDistance );
                    topPosition = verticalIndex * ( this.closedPanelHeight + this.computedPanelDistance );
                }
            }

            // calculate the width and height of the panel
            if ( this.currentIndex !== -1 && Math.floor( index / ( this.rows * this.columns ) ) === this.currentPage ) {
                width = index % this.columns === this.currentIndex % this.columns ? this.computedOpenedPanelWidth : this.collapsedPanelWidth;
                height = Math.floor( index / this.columns ) === Math.floor( this.currentIndex / this.columns ) ? this.computedOpenedPanelHeight : this.collapsedPanelHeight;
            } else {
                width = this.closedPanelWidth;
                height = this.closedPanelHeight;
            }

            // if panels are set to open to their maximum width or height and the current panel
            // should be opened horizontally or vertically, adjust its position and size,
            // so that it's centered and doesn't open more than its size
            if ( Math.floor( index / ( this.rows * this.columns ) ) === this.currentPage &&
                ( this.settings.openedPanelWidth === 'max' && index % this.columns === this.currentIndex % this.columns ) ||
                ( this.settings.openedPanelHeight === 'max' && Math.floor( index / this.columns ) === Math.floor( this.currentIndex / this.columns ) ) ) {
                
                const contentSize = panel.getContentSize();

                if ( index % this.columns === this.currentIndex % this.columns ) {
                    if ( contentSize === 'loading' && this.loadingPanels.indexOf( index ) === -1 ) {
                        this.loadingPanels.push( index );
                    } else if ( contentSize.width < this.computedOpenedPanelWidth ) {
                        leftPosition += ( this.computedOpenedPanelWidth - contentSize.width ) / 2;
                        width = contentSize.width;
                    }
                }

                if ( Math.floor( index / this.columns ) === Math.floor( this.currentIndex / this.columns ) ) {
                    if ( contentSize === 'loading' && this.loadingPanels.indexOf( index ) === -1 ) {
                        this.loadingPanels.push( index );
                    } else if ( contentSize.height < this.computedOpenedPanelHeight ) {
                        topPosition += ( this.computedOpenedPanelHeight - contentSize.height ) / 2;
                        height = contentSize.height;
                    }
                }
            }

            // set the position of the panel
            panel.setPosition( leftPosition, topPosition );

            // set the size of the panel
            panel.setSize( width, height );
        } );

        this.dispatchEvent( 'resize' );
    }

    /*
        Create, remove or update panels based on the HTML specified in the accordion
    */
    updatePanels() {
        // check if there are removed items in the DOM and remove the from the array of panels
        [ ...this.panels ].forEach( ( panel, index ) => {
            if ( this.accordionEl.querySelector( `.ga-panel[data-index="${ index }"]` ) === null ) {
                panel.removeEventListener( 'panelMouseOver' );
                panel.removeEventListener( 'panelMouseOut' );
                panel.removeEventListener( 'panelClick' );
                panel.removeEventListener( 'imagesComplete' );
                panel.destroy();

                const indexOfPanel = this.panels.findIndex( panel => panel.index === index );
                this.panels.splice( indexOfPanel, 1 );
            }
        } );

        // parse the DOM and create un-instantiated panels and reset the indexes
        Array.from( this.accordionEl.getElementsByClassName( 'ga-panel' ) ).forEach( ( panelEl, index ) => {
            if ( panelEl.hasAttribute( 'data-init' ) === false ) {
                const panel = this.createPanel( panelEl );
                this.panels.splice( index, 0, panel );
            }

            this.panels[ index ].settings = this.settings;
            this.panels[ index ].index = index;
        } );
    }

    /*
        Create an individual panel
    */
    createPanel( panelEl ) {
        // create a panel instance and add it to the array of panels
        const panel = new GridAccordionPanel( panelEl, this.settings );

        // listen for 'panelMouseOver' events
        panel.addEventListener( 'panelMouseOver', ( event ) => {
            if ( this.isPageScrolling === true ) {
                return;
            }

            if ( this.settings.openPanelOn === 'hover' ) {
                clearTimeout( this.mouseDelayTimer );

                // open the panel, but only after a short delay in order to prevent
                // opening panels that the user doesn't intend
                this.mouseDelayTimer = setTimeout( () => {
                    this.openPanel( event.detail.index );
                }, this.settings.mouseDelay );
            }

            this.dispatchEvent( 'panelMouseOver', { index: event.detail.index } );
        } );

        // listen for 'panelMouseOut' events
        panel.addEventListener( 'panelMouseOut', ( event ) => {
            if ( this.isPageScrolling === true ) {
                return;
            }

            this.dispatchEvent( 'panelMouseOut', { index: event.detail.index } );
        } );

        // listen for 'panelClick' events
        panel.addEventListener( 'panelClick', ( event ) => {
            if ( this.accordionEl.classList.contains( 'ga-swiping' ) ) {
                return;
            }
            
            if ( this.settings.openPanelOn === 'click' ) {
                // open the panel if it's not already opened
                // and close the panels if the clicked panel is opened
                if ( event.detail.index !== this.currentIndex ) {
                    this.openPanel( event.detail.index );
                } else {
                    this.closePanels();
                }
            }

            this.dispatchEvent( 'panelClick', { index: event.detail.index } );
        } );

        // disable links if the panel should open on click and it wasn't opened yet
        panel.addEventListener( 'panelMouseDown', ( event ) => {
            const links = panelEl.getElementsByTagName( 'a' );

            if ( links.length < 1 ) {
                return;
            }

            Array.from( links ).forEach( ( linkEl ) => {
                linkEl.removeEventListener( 'click', this.eventHandlerReferences[ 'click.link.panel' ] );
            } );

            if ( event.detail.index !== this.currentIndex && this.settings.openPanelOn === 'click' ) {
                Array.from( links ).forEach( ( linkEl ) => {
                    linkEl.addEventListener( 'click', this.eventHandlerReferences[ 'click.link.panel' ] =  ( event ) => {
                        event.preventDefault();
                    } );
                } );
            }
        } );

        // listen for 'imagesComplete' events and if the images were loaded in
        // the panel that is currently opened and the size of the panel is different
        // than the currently computed size of the panel, force the re-opening of the panel
        // to the correct size
        panel.addEventListener( 'imagesComplete', ( event ) => {
            if ( event.detail.index === this.currentIndex && event.detail.contentSize !== this.computedOpenedPanelSize ) {
                this.openPanel( event.detail.index, true );
            }
        } );

        return panel;
    }

    /*
        Return the panel at the specified index
    */
    getPanelAt( index ) {
        return this.panels[ index ];
    }

    /*
        Return the index of the currently opened panel
    */
    getCurrentIndex() {
        return this.currentIndex;
    }

    /*
        Return the total amount of panels
    */
    getTotalPanels() {
        return this.panels.length;
    }

    /*
        Open the next panel
    */
    nextPanel() {
        const index = ( this.currentIndex >= this.getTotalPanels() - 1 ) ? 0 : ( this.currentIndex + 1 );
        this.openPanel( index );
    }

    /*
        Open the previous panel
    */
    previousPanel() {
        const index = this.currentIndex <= 0 ?  ( this.getTotalPanels() - 1 ) : ( this.currentIndex - 1 );
        this.openPanel( index );
    }

    /*
        Destroy the Grid Accordion instance
    */
    destroy() {
        this.addOnsManager.destroyAll();

        // remove inline style
        this.accordionEl.removeAttribute( 'style' );
        this.panelsContainerEl.removeAttribute( 'style' );

        this.accordionEl.setAttribute( 'class', 'grid-accordion ga-no-js' );

        // detach event handlers
        this.accordionEl.removeEventListener( 'mouseenter', this.eventHandlerReferences[ 'mouseenter.accordion' ] );
        this.accordionEl.removeEventListener( 'mouseleave', this.eventHandlerReferences[ 'mouseleave.accordion' ] );

        this.windowResizeHandler.removeEventListener( 'resize' );
        this.windowResizeHandler.destroy();

        // stop animations
        this.stopPanelsAnimation( this.openPanelAnimation );
        this.stopPanelsAnimation( this.closePanelsAnimation );

        // destroy all panels
        this.panels.forEach( ( panel ) => {
            panel.removeEventListener( 'panelMouseOver' );
            panel.removeEventListener( 'panelMouseOut' );
            panel.removeEventListener( 'panelClick' );
            panel.removeEventListener( 'imagesComplete' );

            panel.destroy();
        } );

        this.panels.length = 0;

        // move the panels from the mask container back in the main accordion container
        this.accordionEl.insertBefore( this.panelsContainerEl, this.accordionEl.firstChild );

        // remove elements that were created by the script
        this.panelsMaskEl.remove();
    }

    /*
        Animate the panels using request animation frame
    */
    animatePanels( target, args ) {
        const startTime = new Date().valueOf();
        let progress = 0;

        target.isRunning = true;
        target.timer = window.requestAnimationFrame( animate );

        function animate() {
            if ( progress < 1 ) {
                // get the progress by calculating the elapsed time
                progress = ( new Date().valueOf() - startTime ) / args.duration;

                if ( progress > 1 ) {
                    progress = 1;
                }

                // apply swing easing
                progress = 0.5 - Math.cos( progress * Math.PI ) / 2;

                args.step( progress );

                target.timer = window.requestAnimationFrame( animate );
            } else {
                args.complete();

                target.isRunning = false;
                window.cancelAnimationFrame( target.timer );
            }
        }
    }

    /*
        Stop running panel animations
    */
    stopPanelsAnimation( target ) {
        if ( typeof target.isRunning !== 'undefined' && target.isRunning === true ) {
            target.isRunning = false;
            window.cancelAnimationFrame( target.timer );
        }
    }

    /*
        Open the panel at the specified index
    */
    openPanel( index, force ) {
        if ( index === this.currentIndex && force !== true ) {
            return;
        }

        // remove the "closed" class and add the "opened" class, which indicates
        // that the accordion has an opened panel
        if ( this.accordionEl.classList.contains( 'ga-closed' ) === true ) {
            this.accordionEl.classList.replace( 'ga-closed', 'ga-opened' );
        }

        const previousIndex = this.currentIndex;

        this.currentIndex = index;
        
        // synchronize the page with the selected panel by navigating to the page that
        // contains the panel if necessary
        if ( this.settings.columns !== -1 && this.settings.rows !== -1 ) {
            const page = Math.floor( this.currentIndex / ( this.columns * this.rows ) );

            if ( page !== this.currentPage )
                this.gotoPage( page );

            // reset the current index because when the closePanels was called inside gotoPage the current index became -1
            this.currentIndex = index;
        }

        const targetLeft = [],
            targetTop = [],
            targetWidth = [],
            targetHeight = [],
            startLeft = [],
            startTop = [],
            startWidth = [],
            startHeight = [],
            animatedPanels = [],
            firstPanel = this.getFirstPanelFromPage(),
            lastPanel = this.getLastPanelFromPage();
        
        let counter = 0;

        // reset the list of tracked loading panels
        this.loadingPanels.length = 0;

        if ( this.accordionEl.querySelector( '.ga-panel.ga-opened' ) !== null ) {
            this.accordionEl.querySelector( '.ga-panel.ga-opened' ).classList.remove( 'ga-opened' );
        }
        
        this.accordionEl.getElementsByClassName( 'ga-panel' )[ this.currentIndex ].classList.add( 'ga-opened' );

        // check if the panel needs to open to its maximum width and/or height, and recalculate
        // the width and/or height of the opened panel and the size of the collapsed panel
        if ( this.settings.openedPanelWidth === 'max' ) {
            const openedPanelContentWidth = this.getPanelAt( this.currentIndex ).getContentSize();

            if ( openedPanelContentWidth === 'loading' ) {
                this.computedOpenedPanelWidth = this.closedPanelWidth;
            } else {
                this.computedOpenedPanelWidth = Math.min( openedPanelContentWidth.width, this.maxComputedOpenedPanelWidth );
            }

            this.collapsedPanelWidth = ( this.totalWidth - this.computedOpenedPanelWidth - ( this.columns - 1 ) * this.computedPanelDistance ) / ( this.columns - 1 );
        }

        if ( this.settings.openedPanelHeight === 'max' ) {
            const openedPanelContentHeight = this.getPanelAt( this.currentIndex ).getContentSize();

            if ( openedPanelContentHeight === 'loading' ) {
                this.computedOpenedPanelHeight = this.closedPanelHeight;
            } else {
                this.computedOpenedPanelHeight = Math.min( openedPanelContentHeight.height, this.maxComputedOpenedPanelHeight );
            }

            this.collapsedPanelHeight = ( this.totalHeight - this.computedOpenedPanelHeight - ( this.rows - 1 ) * this.computedPanelDistance ) / ( this.rows - 1 );
        }

        // calculate the minimum width and height between the panels that need to open vertically, respectively horizontally
        if ( this.settings.openedPanelWidth === 'auto' || this.settings.openedPanelHeight === 'auto' ) {
            const minSize = this.getMinSize( firstPanel, lastPanel ),
                maxWidth = minSize.width,
                maxHeight = minSize.height;

            if ( this.settings.openedPanelWidth === 'auto' ) {
                this.computedOpenedPanelWidth = maxWidth;
                this.collapsedPanelWidth = ( this.totalWidth - this.computedOpenedPanelWidth - ( this.columns - 1 ) * this.computedPanelDistance ) / ( this.columns - 1 );
            }
            
            if ( this.settings.openedPanelHeight === 'auto' ) {
                this.computedOpenedPanelHeight = maxHeight;
                this.collapsedPanelHeight = ( this.totalHeight - this.computedOpenedPanelHeight - ( this.rows - 1 ) * this.computedPanelDistance ) / ( this.rows - 1 );
            }
        }
        
        // get the starting and target position and size of each panel
        for ( let i = firstPanel; i <= lastPanel; i++ ) {
            const panel = this.getPanelAt( i ),
                position = panel.getPosition(),
                contentSize = panel.getContentSize();

            startLeft[i] = position.left;
            startTop[i] = position.top;

            if ( this.settings.orientation === 'horizontal' ) {
                targetLeft[i] = this.currentPage * ( this.totalWidth + this.computedPanelDistance ) +
                                ( counter % this.columns ) * ( this.collapsedPanelWidth + this.computedPanelDistance ) +
                                ( i % this.columns > this.currentIndex % this.columns ? this.computedOpenedPanelWidth - this.collapsedPanelWidth : 0 );
                
                targetTop[i] = ( Math.floor( counter / this.columns ) ) * ( this.collapsedPanelHeight + this.computedPanelDistance ) +
                                ( Math.floor( i / this.columns ) > Math.floor( this.currentIndex / this.columns ) ? this.computedOpenedPanelHeight - this.collapsedPanelHeight : 0 );
            } else {
                targetLeft[i] = ( counter % this.columns ) * ( this.collapsedPanelWidth + this.computedPanelDistance ) +
                                ( i % this.columns > this.currentIndex % this.columns ? this.computedOpenedPanelWidth - this.collapsedPanelWidth : 0 );

                targetTop[i] = this.currentPage * ( this.totalHeight + this.computedPanelDistance ) +
                                ( Math.floor( counter / this.columns ) ) * ( this.collapsedPanelHeight + this.computedPanelDistance ) +
                                ( Math.floor( i / this.columns ) > Math.floor( this.currentIndex / this.columns ) ? this.computedOpenedPanelHeight - this.collapsedPanelHeight : 0 );
            }

            const size = panel.getSize();

            startWidth[i] = size.width;
            startHeight[i] = size.height;
            targetWidth[i] = i % this.columns === this.currentIndex % this.columns ? this.computedOpenedPanelWidth : this.collapsedPanelWidth;
            targetHeight[i] = Math.floor( i / this.columns ) === Math.floor( this.currentIndex / this.columns ) ? this.computedOpenedPanelHeight : this.collapsedPanelHeight;

            // adjust the left position and width of the vertically opened panels,
            // if they are set to open to their maximum width
            if ( this.settings.openedPanelWidth === 'max' && i % this.columns === this.currentIndex % this.columns ) {
                if ( contentSize === 'loading' && this.loadingPanels.indexOf( i ) === -1 ) {
                    this.loadingPanels.push( i );
                } else if ( contentSize.width < this.computedOpenedPanelWidth ) {
                    targetLeft[i] += ( this.computedOpenedPanelWidth - contentSize.width ) / 2;
                    targetWidth[i] = contentSize.width;
                }
            }

            // adjust the top position and height of the horizontally opened panels,
            // if they are set to open to their maximum height
            if ( this.settings.openedPanelHeight === 'max' && Math.floor( i / this.columns ) === Math.floor( this.currentIndex / this.columns ) ) {
                if ( contentSize === 'loading' && this.loadingPanels.indexOf( i ) === -1 ) {
                    this.loadingPanels.push( i );
                } else if ( contentSize.height < this.computedOpenedPanelHeight ) {
                    targetTop[i] += ( this.computedOpenedPanelHeight - contentSize.height ) / 2;
                    targetHeight[i] = contentSize.height;
                }
            }

            // check if the panel's position needs to change
            if ( targetLeft[i] !== startLeft[i] || targetTop[i] !== startTop[i] )
                animatedPanels.push( i );

            // check if the panel's size needs to change
            if ( ( targetWidth[i] !== startWidth[i] || targetHeight[i] !== startHeight[i] ) && this.loadingPanels.indexOf( i ) === -1 )
                animatedPanels.push( i );

            counter++;
        }

        const totalPanels = animatedPanels.length;

        // stop the close panels animation if it's on the same page
        if ( this.closePanelsAnimation.page === this.currentPage ) {
            this.stopPanelsAnimation( this.closePanelsAnimation );
        }

        // stop any running animations
        this.stopPanelsAnimation( this.openPanelAnimation );

        // assign the current page
        this.openPanelAnimation.page = this.currentPage;

        // animate the panels
        this.animatePanels( this.openPanelAnimation, {
            duration: this.settings.openPanelDuration,
            step: ( progress ) => {
                for ( let i = 0; i < totalPanels; i++ ) {
                    const value = animatedPanels[ i ],
                        panel = this.getPanelAt( value );

                    panel.setPosition( progress * ( targetLeft[value] - startLeft[value] ) + startLeft[value], progress * ( targetTop[value] - startTop[value] ) + startTop[value] );
                    panel.setSize( progress * ( targetWidth[value] - startWidth[value] ) + startWidth[value], progress * ( targetHeight[value] - startHeight[value] ) + startHeight[value] );
                }
            },
            complete: () => {
                // fire 'panelOpenComplete' event
                this.dispatchEvent( 'panelOpenComplete', { index: this.currentIndex } );
            }
        } );

        this.dispatchEvent( 'panelOpen', { index: this.currentIndex, previousIndex: previousIndex } );
    }

    /*
        Close the panels
    */
    closePanels() {
        const previousIndex = this.currentIndex;

        this.currentIndex = -1;

        // remove the "opened" class and add the "closed" class, which indicates
        // that the accordion is closed
        if ( this.accordionEl.classList.contains( 'ga-opened' ) === true ) {
            this.accordionEl.classList.replace( 'ga-opened', 'ga-closed' );
        }

        // remove the "opened" class from the previously opened panel
        if ( this.accordionEl.querySelector( '.ga-panel.ga-opened' ) !== null ) {
            this.accordionEl.querySelector( '.ga-panel.ga-opened' ).classList.remove( 'ga-opened' );
        }
        
        clearTimeout( this.mouseDelayTimer );

        const targetLeft = [],
            targetTop = [],
            targetWidth = [],
            targetHeight = [],
            startLeft = [],
            startTop = [],
            startWidth = [],
            startHeight = [],
            firstPanel = this.getFirstPanelFromPage(),
            lastPanel = this.getLastPanelFromPage();
        
        let counter = 0;

        // get the starting and target size and position of each panel
        for ( let i = firstPanel; i <= lastPanel; i++ ) {
            const panel = this.getPanelAt( i ),
                position = panel.getPosition();
				
            startLeft[i] = position.left;
            startTop[i] = position.top;

            if ( this.settings.orientation === 'horizontal' ) {
                targetLeft[i] = this.currentPage * ( this.totalWidth + this.computedPanelDistance ) +
                                ( counter % this.columns ) * ( this.closedPanelWidth + this.computedPanelDistance );
                
                targetTop[i] = ( Math.floor( counter / this.columns ) ) * ( this.closedPanelHeight + this.computedPanelDistance );
            } else {
                targetLeft[i] = ( counter % this.columns ) * ( this.closedPanelWidth + this.computedPanelDistance );

                targetTop[i] = this.currentPage * ( this.totalHeight + this.computedPanelDistance ) +
                                ( Math.floor( counter / this.columns ) ) * ( this.closedPanelHeight + this.computedPanelDistance );
            }

            const size = panel.getSize();
            
            startWidth[i] = size.width;
            startHeight[i] = size.height;
            targetWidth[i] = this.closedPanelWidth;
            targetHeight[i] = this.closedPanelHeight;

            counter++;
        }

        // stop the open panel animation if it's on the same page
        if ( this.openPanelAnimation.page === this.currentPage ) {
            this.stopPanelsAnimation( this.openPanelAnimation );
        }

        // stop any running animations
        this.stopPanelsAnimation( this.closePanelsAnimation );

        // assign the current page
        this.closePanelsAnimation.page = this.currentPage;

        // animate the panels
        this.animatePanels( this.closePanelsAnimation, {
            duration: this.settings.closePanelDuration,
            step: ( progress ) => {
                for ( let i = firstPanel; i <= lastPanel; i++ ) {
                    const panel = this.getPanelAt( i );

                    panel.setPosition( progress * ( targetLeft[i] - startLeft[i] ) + startLeft[i], progress * ( targetTop[i] - startTop[i] ) + startTop[i] );
                    panel.setSize( progress * ( targetWidth[i] - startWidth[i] ) + startWidth[i], progress * ( targetHeight[i] - startHeight[i] ) + startHeight[i] );
                }
            },
            complete: () => {
                // fire 'panelsCloseComplete' event
                this.dispatchEvent( 'panelsCloseComplete', { previousIndex: previousIndex } );
            }
        } );

        // fire 'panelsClose' event
        this.dispatchEvent( 'panelsClose', { previousIndex: previousIndex } );
    }

    /*
        Calculate the minimum width on vertical and minimum height on horizontal
        between the panels included in the specified interval
    */
    getMinSize( first, last ) {
        let maxWidth = this.maxComputedOpenedPanelWidth,
            maxHeight = this.maxComputedOpenedPanelHeight;

        // get the starting and target position and size of each panel
        for ( let i = first; i <= last; i++ ) {
            const panel = this.getPanelAt( i ),
                contentSize = panel.getContentSize();

            if ( i % this.columns === this.currentIndex % this.columns ) {
                
                if ( contentSize === 'loading' && this.loadingPanels.indexOf( i ) === -1 ) {
                    this.loadingPanels.push( i );
                    maxWidth = this.closedPanelWidth;
                } else if ( contentSize.width < maxWidth ) {
                    maxWidth = contentSize.width;
                }
            }
            
            if ( Math.floor( i / this.columns ) === Math.floor( this.currentIndex / this.columns ) ) {
                if ( contentSize === 'loading' && this.loadingPanels.indexOf( i ) === -1 ) {
                    this.loadingPanels.push( i );
                    maxHeight = this.closedPanelHeight;
                } else if ( contentSize.height < maxHeight ) {
                    maxHeight = contentSize.height;
                }
            }
        }

        return {
            width: maxWidth,
            height: maxHeight
        };
    }

    /*
        Return the total number of pages
    */
    getTotalPages() {
        if ( this.settings.columns === -1 || this.settings.rows === -1 ) {
            return 1;
        }
        
        return Math.ceil( this.getTotalPanels() / ( this.columns * this.rows ) );
    }

    /*
        Return the current page
    */
    getCurrentPage() {
        return this.settings.columns === -1 ? 0 : this.currentPage;
    }

    /*
        Navigate to the indicated page
    */
    gotoPage( index ) {
        // close any opened panels before scrolling to a different page
        if ( this.currentIndex !== -1 ) {
            this.closePanels();
        }

        this.currentPage = index;
        this.isPageScrolling = true;

        const positionProperty = this.settings.orientation === 'horizontal' ? 'left' : 'top',
            sizeValue = this.settings.orientation === 'horizontal' ? this.totalWidth : this.totalHeight;

        let targetPosition = - ( index * sizeValue + this.currentPage * this.computedPanelDistance );
        
        if ( this.currentPage === this.getTotalPages() - 1 ) {
            targetPosition = - ( this.totalPanelsSize - sizeValue );
        }

        // fire 'pageScroll' event
        this.dispatchEvent( 'pageScroll', { index: this.currentPage } );

        this.panelsContainerEl.addEventListener( 'transitionend', () => {
            this.isPageScrolling = false;

            // fire 'pageScrollComplete' event
            this.dispatchEvent( 'pageScrollComplete', { index: this.currentPage } );
        } );

        this.panelsContainerEl.style.transition = `${ positionProperty } ${ this.settings.pageScrollDuration / 1000 }s`;
        this.panelsContainerEl.style[ positionProperty ] = resolveUnit( targetPosition );
    }

    /*
        Navigate to the next page
    */
    nextPage() {
        const index = this.currentPage >= this.getTotalPages() - 1 ? 0 : this.currentPage + 1;
        this.gotoPage( index );
    }

    /*
        Navigate to the previous page
    */
    previousPage() {
        const index = this.currentPage <= 0 ? this.getTotalPages() - 1 : this.currentPage - 1;
        this.gotoPage( index );
    }

    /*
        Calculate and return the first panel from the current page
    */
    getFirstPanelFromPage() {
        if ( this.getTotalPages() === 1 ) {
            return 0;
        } else {
            return this.currentPage * ( this.columns * this.rows );
        }
    }

    /*
        Calculate and return the last panel from the current page
    */
    getLastPanelFromPage() {
        if ( this.getTotalPages() === 1 ) {
            return this.getTotalPanels() - 1;
        } else if ( this.currentPage === this.getTotalPages() - 1 ) {
            return this.getTotalPanels() - 1;
        } else {
            return ( this.currentPage + 1 ) * ( this.columns * this.rows ) - 1;
        }
    }
}

export default GridAccordion;