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

  //Toggle the voxelObject material visibility
  $("#textureShowCheckbox").on("click", function() {
    window.scene.getObjectByName( "voxelObjectMaterial" ).visible = $(this).prop('checked');
  });

}
