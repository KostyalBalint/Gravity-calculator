//User interface releated javascript

//import $ from "jquery";

export function init(CONFIG, geometrys){

  //Set the cellSize slider to the default from config
  $("#voxelCount").val(CONFIG.cellSize);
  $("#voxelCountText").html($("#voxelCount").val());

  //Set switches to default
  $("#chartPoints").prop('disabled', true);
  $("#gravityPoints").prop('disabled', true);

  //Fill up geometry selection box
  geometrys.forEach((geometry, i) => {
    $("#geometrySelect").append('<option value="' + i + '">' + geometry.name + '</option>');
  });

  //cellSize slider event listener, so the text will change as the user slides the slider
  $("#voxelCount").on("change mousemove", function() {
    $("#voxelCountText").html($(this).val());
    CONFIG.cellSize = parseInt($(this).val());
  });

  //Toggle the voxelObject material visibility
  $("#textureShowCheckbox").on("click", function() {
    window.scene.getObjectByName( "voxelObjectMaterial" ).visible = $(this).prop('checked');
  });

  //Toggle voxelObject wireframe visibility
  $("#wireframeShowCheckbox").on("click", function() {
    window.scene.getObjectByName( "voxelObjectWireFrame" ).visible = $(this).prop('checked');
  });

  //Toggle gravity measurement points in ThreeJs scene
  $("#chartPoints").on("click", function() {
    window.scene.getObjectByName( "chartPoints" ).visible = $(this).prop('checked');
  });

  //Generate / Regenerate the chart
  $("#generateChartBtn").on("click", function(){
    $("#calculationOverlay").fadeIn(function(){
      //50 ms timeout gives enough time to the GUI to update before we calculate the chart
      setTimeout(function(){
        //Update chart can't be async because of GPU computation, this means
        //We can't update the GUI while it's running
        window.physics.updateChart();

        //After the update finnished fadeOut the overlay
        $("#calculationOverlay").fadeOut();
      }, 50);
    });
  });

}
