import { checkImagesComplete, checkImagesStatus, resolveUnit } from '../helpers/util.js';
import CustomEventTarget from '../helpers/custom-event-target.js';

class GridAccordionPanel extends CustomEventTarget {

    // Index of the panel
    #index;

    // Reference to the panel element
    panelEl;

    // reference to the global settings of the accordion
    settings;

    isLoading = false;

    isLoaded = false;

    // Stores references the event handlers in pairs containing the event identifier and the event handler
    // in order to be able to retrieve them when they need to be removed
    eventHandlerReferences = {};

    constructor( panel, settings ) {
        super();

        this.panelEl = panel;
        this.settings = settings;

        // Initialize the panel
        this.init();
    }

    // The starting point for the panel
    init() {
        // Mark the panel as initialized
        this.panelEl.setAttribute( 'data-init', true );

        // listen for 'mouseenter' events
        this.panelEl.addEventListener( 'mouseenter', this.eventHandlerReferences[ 'mouseenter.panel' ] = () => {
            this.dispatchEvent( 'panelMouseOver', { index: this.index } );
        });

        // listen for 'mouseleave' events
        this.panelEl.addEventListener( 'mouseleave', this.eventHandlerReferences[ 'mouseleave.panel' ] = () => {
            this.dispatchEvent( 'panelMouseOut', { index: this.index } );
        });

        // listen for 'click' events
        this.panelEl.addEventListener( 'click', this.eventHandlerReferences[ 'click.panel' ] = () => {
            this.dispatchEvent( 'panelClick', { index: this.index } );
        });

        // listen for 'mousedown' events
        this.panelEl.addEventListener( 'mousedown', this.eventHandlerReferences[ 'mousedown.panel' ] = () => {
            this.dispatchEvent( 'panelMouseDown', { index: this.index } );
        });
    }

    getPosition() {
        return {
            'left': parseInt(this.panelEl.style.left, 10),
            'top': parseInt(this.panelEl.style.top, 10)
        };
    }

    setPosition( left, top ) {
        this.panelEl.style.left = resolveUnit( left );
        this.panelEl.style.top = resolveUnit( top );
    }

    getSize() {
        return {
            'width': parseInt( this.panelEl.style.width, 10 ),
            'height': parseInt( this.panelEl.style.height, 10)
        };
    }

    setSize( width, height ) {
        this.panelEl.style.width = resolveUnit( width );
        this.panelEl.style.height = resolveUnit( height );
    }

    getContentSize() {
        if ( checkImagesStatus( this.panelEl ) === 'complete' ) {
            this.isLoaded = true;
        }

        // check if there are loading images
        if ( this.isLoaded === false ) {
            checkImagesComplete( this.panelEl ).then( () => {
                this.isLoaded = true;

                this.dispatchEvent( 'imagesComplete', { index: this.index, contentSize: this.getContentSize() } );
            });

            return 'loading';
        }

        return {
            width: this.panelEl.scrollWidth,
            height: this.panelEl.scrollHeight
        };
    }

    // Destroy the slide
    destroy() {
        // Clean the panel element from attached styles and data
        this.panelEl.removeAttribute( 'style' );
        this.panelEl.removeAttribute( 'data-init' );
        this.panelEl.removeAttribute( 'data-index' );

        // detach all event listeners
        this.panelEl.removeEventListener( 'mouseenter', this.eventHandlerReferences[ 'mouseenter.panel' ] );
        this.panelEl.removeEventListener( 'mouseleave', this.eventHandlerReferences[ 'mouseleave.panel' ] );
        this.panelEl.removeEventListener( 'click', this.eventHandlerReferences[ 'click.panel' ] );
        this.panelEl.removeEventListener( 'mousedown', this.eventHandlerReferences[ 'mousedown.panel' ] );
    }

    // Return the index of the slide
    get index() {
        return this.#index;
    }

    // Set the index of the slide
    set index( index ) {
        this.#index = index;
        this.panelEl.setAttribute( 'data-index', this.#index );
    }
}

export default GridAccordionPanel;