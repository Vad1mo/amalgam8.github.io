---
---
(function($) {
  $(document).ready( function() {
    var sidebarOpen = true;
    var sidebar = $("#sidebar-container");
    var content = $("#content-container");
    var width = $(document). width();

    function setSidebar() {
      // set sidebar height
      sidebar.height($("body").height());

      // 992 is the default breakpoint set in Bootstrap 3 for col-md
      if (width < 992)
        sidebarOpen = false;
      if (sidebarOpen == false) {
        sidebar.toggle();
      }

      // 1756 is a judgement call on the breakpoint for when the sidebar needs a col-lg-3 and not col-lg-12
      if (width < 1756) {
        sidebar.removeClass("col-lg-2");
        sidebar.addClass("col-lg-3");

        sidebar.removeClass("col-lg-10");
        sidebar.addClass("col-lg-9");
      }
      else {
        sidebar.removeClass("col-lg-3");
        sidebar.addClass("col-lg-2");

        content.removeClass("col-lg-9");
        content.addClass("col-lg-10");
      }
    }

    $(document).on('click', '#sidebar-tab', function() {
      $(this).toggleClass('glyphicon-chevron-right');
      $(this).toggleClass('glyphicon-chevron-left');
      sidebar.toggle(250);
      sidebarOpen = !sidebarOpen;
    });

    /* toggle category tree */
    $(document).on('click', '.tree-toggle', function () {
        $(this).children('i.fa').toggleClass('fa-caret-right');
        $(this).children('i.fa').toggleClass('fa-caret-down');
        $(this).parent().children('ul.tree').toggle(200);
    });

    function onWindowResize() {
    	setSidebar();
    }

    // initialize
    window.addEventListener('resize', onWindowResize, false);
    setSidebar();
  });
}(jQuery));
