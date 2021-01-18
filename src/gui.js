//User interface releated javascript

import $ from "jquery";

export function init(CONFIG){

  //Set the cellSize slider to the default from config
  $("#voxelCount").val(CONFIG.cellSize);
  $("#voxelCountText").html($("#voxelCount").val());

  //cellSize slider event listener, so the text will change as the user slides the slider
  $("#voxelCount").on("change mousemove", function() {
    $("#voxelCountText").html($(this).val());
    CONFIG.cellSize = $(this).val();
  });

  $("#voxelCount").on("mouseup", function(){
    console.log($(this));
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
    $("#progessBarOverlay").fadeIn(function(){
      window.physics.updateChart(function(precentage){
        $("#progressBar").css("width", precentage + "%").text(precentage + " %");
        console.log(precentage);
      });
    });
    $("#progessBarOverlay").fadeOut();
  });

}
